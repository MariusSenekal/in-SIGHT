// PUT /api/notification-preferences
// Saves the current user's notification settings. Body is an array of
// { type, enabled, intervalDays, sendTimeSast } -- one entry per type the
// client wants to change; types omitted are left untouched.
import { requireAuth } from '~/server/utils/pgrest'
import { upsertPreference, type NotificationType } from '~/server/utils/notificationPreferences'

const VALID_TYPES: NotificationType[] = ['next_service_due', 'contract_renewal', 'birthday']
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

interface PreferenceInput {
  type: NotificationType
  enabled: boolean
  intervalDays: number[]
  sendTimeSast: string
}

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)
  const userId = Number(payload.sub)

  const body = await readBody<PreferenceInput[]>(event)
  if (!Array.isArray(body) || body.length === 0) {
    throw createError({ statusCode: 400, message: 'Expected an array of preferences.' })
  }

  for (const pref of body) {
    if (!VALID_TYPES.includes(pref.type)) {
      throw createError({ statusCode: 400, message: `Invalid notification type: ${pref.type}` })
    }
    if (!TIME_RE.test(pref.sendTimeSast)) {
      throw createError({ statusCode: 400, message: 'sendTimeSast must be in HH:MM 24-hour format.' })
    }
    if (!Array.isArray(pref.intervalDays) || pref.intervalDays.some((d) => !Number.isInteger(d) || d < 0 || d > 365)) {
      throw createError({ statusCode: 400, message: 'intervalDays must be whole numbers between 0 and 365.' })
    }
  }

  for (const pref of body) {
    await upsertPreference({
      userId,
      type: pref.type,
      enabled: Boolean(pref.enabled),
      intervalDays: [...new Set(pref.intervalDays)].sort((a, b) => b - a),
      sendTimeSast: pref.sendTimeSast
    })
  }

  return { ok: true }
})
