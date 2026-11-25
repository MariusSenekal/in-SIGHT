// Sends a push notification to a record's OWNER ONLY (never their teammates
// or company) once a day for every client/staff birthday landing on one of
// that owner's configured day-offsets (defaults to today/tomorrow). Runs
// in-process since the app is a long-lived container, not a serverless
// function — no external cron infra needed. Each owner can also set what
// time of day (SAST) their reminders may go out from, via
// insight.notification_preferences — see server/utils/notificationPreferences.ts.
import { pgrestAdmin } from '../utils/pgrest'
import { getUpcomingBirthdays } from '../utils/birthdays'
import { sendPushToUser } from '../utils/push'
import { createNotification } from '../utils/notifications'
import { getAllPreferences, resolvePreference, sastTimeHasReached } from '../utils/notificationPreferences'

const CHECK_INTERVAL_MS = 15 * 60 * 1000

const todayDateString = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// The daily gate is per-owner (not global) since each owner can pick their
// own send time -- one owner having already been notified today must never
// block another owner whose configured time arrives later.
const runKindFor = (ownerId: number) => `birthday_push:${ownerId}`

const hasRunToday = async (ownerId: number): Promise<boolean> => {
  const rows = await pgrestAdmin<any[]>('/notification_runs', {
    query: { run_date: `eq.${todayDateString()}`, kind: `eq.${runKindFor(ownerId)}`, select: 'run_date' }
  })
  return (rows?.length ?? 0) > 0
}

const markRunToday = async (ownerId: number) => {
  await pgrestAdmin('/notification_runs', {
    method: 'POST',
    body: { run_date: todayDateString(), kind: runKindFor(ownerId) },
    extraHeaders: { Prefer: 'resolution=ignore-duplicates' }
  }).catch(() => {})
}

const runBirthdayPushCheck = async () => {
  const [clients, staff, preferencesByUser] = await Promise.all([
    pgrestAdmin<any[]>('/clients', {
      query: { date_of_birth: 'not.is.null', owner_user_id: 'not.is.null', select: 'id,company_name,name,surname,date_of_birth,owner_user_id' }
    }),
    pgrestAdmin<any[]>('/staff_members', {
      query: { date_of_birth: 'not.is.null', owner_user_id: 'not.is.null', select: 'id,name,surname,date_of_birth,owner_user_id' }
    }),
    getAllPreferences()
  ])

  const ownerIds = new Set<number>()
  ;(clients ?? []).forEach((c) => ownerIds.add(Number(c.owner_user_id)))
  ;(staff ?? []).forEach((s) => ownerIds.add(Number(s.owner_user_id)))

  if (ownerIds.size === 0) return

  const users = await pgrestAdmin<Array<{ id: number; name: string }>>('/users', {
    query: { id: `in.(${[...ownerIds].join(',')})`, select: 'id,name' }
  })
  const nameById = new Map((users ?? []).map((u) => [Number(u.id), u.name]))

  for (const ownerId of ownerIds) {
    const pref = resolvePreference(preferencesByUser.get(ownerId), ownerId, 'birthday')
    if (!pref.enabled) continue
    if (!sastTimeHasReached(pref.sendTimeSast)) continue
    if (await hasRunToday(ownerId)) continue

    if (pref.intervalDays.length === 0) { await markRunToday(ownerId); continue }

    const ownedClients = (clients ?? []).filter((c) => Number(c.owner_user_id) === ownerId)
    const ownedStaff = (staff ?? []).filter((s) => Number(s.owner_user_id) === ownerId)
    const birthdays = getUpcomingBirthdays(ownedClients, ownedStaff, pref.intervalDays)

    if (birthdays.length > 0) {
      const ownerName = nameById.get(ownerId) || 'your account'

      for (const bday of birthdays) {
        const label = bday.type === 'client' ? 'Client' : 'HR'
        const whenLabel = bday.daysBefore === 0 ? 'today' : bday.daysBefore === 1 ? 'tomorrow' : `in ${bday.daysBefore} days`
        const title = `🎂 Birthday ${whenLabel}`
        const body = `${ownerName}'s account — ${label} record ${bday.name}'s birthday is ${whenLabel}.`
        const url = bday.type === 'client' ? '/modules/clients' : '/modules/hr'

        await sendPushToUser(ownerId, {
          title,
          body,
          tag: `birthday-${bday.type}-${bday.id}-${whenLabel}`,
          url
        })

        await createNotification({
          userId: ownerId,
          type: 'birthday',
          title,
          body,
          linkType: bday.type === 'client' ? 'clients' : 'hr',
          linkId: bday.id,
          dedupeKey: `birthday-${bday.type}-${bday.id}-${whenLabel}-${todayDateString()}`
        })
      }
    }

    await markRunToday(ownerId)
  }
}

const maybeRun = async () => {
  await runBirthdayPushCheck()
}

export default defineNitroPlugin(() => {
  setTimeout(() => {
    maybeRun().catch((error) => console.error('[birthday-push] initial check failed', error))
  }, 30_000)

  setInterval(() => {
    maybeRun().catch((error) => console.error('[birthday-push] check failed', error))
  }, CHECK_INTERVAL_MS)
})
