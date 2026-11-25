// Reads per-user notification preferences (insight.notification_preferences)
// with sane fallbacks for users who've never saved any -- the historical
// defaults of 90/30/1 days before, sent from 10:00 SAST, matching what
// client-reminders.ts and birthday-notifications.ts hardcoded before this
// table existed.
import { pgrestAdmin } from './pgrest'

export type NotificationType = 'next_service_due' | 'contract_renewal' | 'birthday'

export interface NotificationPreference {
  userId: number
  type: NotificationType
  enabled: boolean
  intervalDays: number[]
  sendTimeSast: string // 'HH:MM' or 'HH:MM:SS'
}

export const DEFAULT_INTERVAL_DAYS: Record<NotificationType, number[]> = {
  next_service_due: [90, 30, 1],
  contract_renewal: [90, 30, 1],
  birthday: [1, 0]
}

export const DEFAULT_SEND_TIME_SAST = '10:00'

const defaultsFor = (userId: number, type: NotificationType): NotificationPreference => ({
  userId,
  type,
  enabled: true,
  intervalDays: DEFAULT_INTERVAL_DAYS[type],
  sendTimeSast: DEFAULT_SEND_TIME_SAST
})

interface PreferenceRow {
  user_id: number
  type: string
  enabled: boolean
  interval_days: number[]
  send_time_sast: string
}

/** All saved preference rows for a single user, type -> preference (missing types fall back to defaults when read via getPreference). */
export const getUserPreferences = async (userId: number): Promise<Record<string, NotificationPreference>> => {
  const rows = await pgrestAdmin<PreferenceRow[]>('/notification_preferences', {
    query: { user_id: `eq.${userId}`, select: '*' }
  }).catch(() => [])

  const byType: Record<string, NotificationPreference> = {}
  for (const row of rows ?? []) {
    byType[row.type] = {
      userId: row.user_id,
      type: row.type as NotificationType,
      enabled: row.enabled,
      intervalDays: row.interval_days ?? [],
      sendTimeSast: (row.send_time_sast ?? DEFAULT_SEND_TIME_SAST).slice(0, 5)
    }
  }
  return byType
}

/** Preferences for every user that has an owner-able record, keyed by userId then type -- one bulk fetch instead of N queries in the daily loops. */
export const getAllPreferences = async (): Promise<Map<number, Record<string, NotificationPreference>>> => {
  const rows = await pgrestAdmin<PreferenceRow[]>('/notification_preferences', {
    query: { select: '*' }
  }).catch(() => [])

  const byUser = new Map<number, Record<string, NotificationPreference>>()
  for (const row of rows ?? []) {
    const entry = byUser.get(row.user_id) ?? {}
    entry[row.type] = {
      userId: row.user_id,
      type: row.type as NotificationType,
      enabled: row.enabled,
      intervalDays: row.interval_days ?? [],
      sendTimeSast: (row.send_time_sast ?? DEFAULT_SEND_TIME_SAST).slice(0, 5)
    }
    byUser.set(row.user_id, entry)
  }
  return byUser
}

export const resolvePreference = (
  byType: Record<string, NotificationPreference> | undefined,
  userId: number,
  type: NotificationType
): NotificationPreference => byType?.[type] ?? defaultsFor(userId, type)

export const upsertPreference = async (pref: {
  userId: number
  type: NotificationType
  enabled: boolean
  intervalDays: number[]
  sendTimeSast: string
}): Promise<void> => {
  await pgrestAdmin('/notification_preferences', {
    method: 'POST',
    body: {
      user_id: pref.userId,
      type: pref.type,
      enabled: pref.enabled,
      interval_days: pref.intervalDays,
      send_time_sast: pref.sendTimeSast,
      updated_at: new Date().toISOString()
    },
    extraHeaders: { Prefer: 'resolution=merge-duplicates,return=minimal' }
  })
}

// SAST is a fixed UTC+2 offset with no DST, so "current SAST time" is always
// just UTC + 2 hours -- no timezone library needed.
export const currentSastTime = (): { hours: number; minutes: number } => {
  const now = new Date()
  const sastMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + 120) % 1440
  return { hours: Math.floor(sastMinutes / 60), minutes: sastMinutes % 60 }
}

export const sastTimeHasReached = (sendTimeSast: string): boolean => {
  const [h, m] = sendTimeSast.split(':').map(Number)
  const { hours, minutes } = currentSastTime()
  return hours * 60 + minutes >= h * 60 + (m || 0)
}
