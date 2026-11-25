// Daily check for client-record date reminders: next service due and
// contract renewal, each fired at the owner's configured day-offsets before
// the date (defaults to 90, 30 and 1 day(s) before). Delivered to the
// client's OWNER ONLY, the same way birthdays are (see
// birthday-notifications.ts): a push notification (works even logged out)
// and an in-app notification row, live-pushed over the owner's socket room
// if they have a tab open right now. Runs in-process on its own daily gate,
// independent of the birthday check, since the app is a long-lived
// container, not a serverless function. Each owner can set what time of day
// (SAST) their reminders may go out from, and disable either type, via
// insight.notification_preferences — see server/utils/notificationPreferences.ts.
import { pgrestAdmin } from '../utils/pgrest'
import { getDueReminders, REMINDER_INTERVALS_DAYS, type ReminderKind } from '../utils/clientReminders'
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

// Per-owner, per-type gate -- one owner/type combo having already run today
// must never block another owner, or the other type for the same owner,
// since each can have its own send time.
const runKindFor = (ownerId: number, kind: ReminderKind) => `client_date_reminders:${ownerId}:${kind}`

const hasRunToday = async (ownerId: number, kind: ReminderKind): Promise<boolean> => {
  const rows = await pgrestAdmin<any[]>('/notification_runs', {
    query: { run_date: `eq.${todayDateString()}`, kind: `eq.${runKindFor(ownerId, kind)}`, select: 'run_date' }
  })
  return (rows?.length ?? 0) > 0
}

const markRunToday = async (ownerId: number, kind: ReminderKind) => {
  await pgrestAdmin('/notification_runs', {
    method: 'POST',
    body: { run_date: todayDateString(), kind: runKindFor(ownerId, kind) },
    extraHeaders: { Prefer: 'resolution=ignore-duplicates' }
  }).catch(() => {})
}

const intervalLabel = (days: number) => (days === 1 ? 'tomorrow' : days === 0 ? 'today' : `in ${days} days`)

const runClientReminderCheck = async () => {
  const [clients, preferencesByUser] = await Promise.all([
    pgrestAdmin<any[]>('/clients', {
      query: {
        owner_user_id: 'not.is.null',
        select: 'id,company_name,name,surname,next_service_due,contract_renewal_date,owner_user_id'
      }
    }),
    getAllPreferences()
  ])

  if (!clients?.length) return

  const ownerIds = [...new Set(clients.map((c) => Number(c.owner_user_id)))]

  for (const ownerId of ownerIds) {
    const servicePref = resolvePreference(preferencesByUser.get(ownerId), ownerId, 'next_service_due')
    const contractPref = resolvePreference(preferencesByUser.get(ownerId), ownerId, 'contract_renewal')

    const ownedClients = clients.filter((c) => Number(c.owner_user_id) === ownerId)
    const reminders = getDueReminders(ownedClients, {
      next_service_due: servicePref.enabled ? (servicePref.intervalDays.length ? servicePref.intervalDays : REMINDER_INTERVALS_DAYS) : [],
      contract_renewal: contractPref.enabled ? (contractPref.intervalDays.length ? contractPref.intervalDays : REMINDER_INTERVALS_DAYS) : []
    })

    for (const kind of ['next_service_due', 'contract_renewal'] as ReminderKind[]) {
      const pref = kind === 'next_service_due' ? servicePref : contractPref
      if (!pref.enabled) continue
      if (!sastTimeHasReached(pref.sendTimeSast)) continue
      if (await hasRunToday(ownerId, kind)) continue

      for (const reminder of reminders.filter((r) => r.kind === kind)) {
        const when = intervalLabel(reminder.intervalDays)
        const isService = reminder.kind === 'next_service_due'
        const title = isService ? `🧹 Service due ${when}` : `📄 Contract renewal ${when}`
        const body = isService
          ? `${reminder.clientName}'s next service is due ${when} (${reminder.dueDate}).`
          : `${reminder.clientName}'s contract renews ${when} (${reminder.dueDate}).`
        const tag = `${reminder.kind}-${reminder.clientId}-${reminder.intervalDays}-${reminder.dueDate}`

        await sendPushToUser(ownerId, { title, body, tag, url: '/modules/clients' })

        await createNotification({
          userId: ownerId,
          type: reminder.kind,
          title,
          body,
          linkType: 'clients',
          linkId: reminder.clientId,
          dedupeKey: tag
        })
      }

      await markRunToday(ownerId, kind)
    }
  }
}

const maybeRun = async () => {
  await runClientReminderCheck()
}

export default defineNitroPlugin(() => {
  setTimeout(() => {
    maybeRun().catch((error) => console.error('[client-reminders] initial check failed', error))
  }, 45_000)

  setInterval(() => {
    maybeRun().catch((error) => console.error('[client-reminders] check failed', error))
  }, CHECK_INTERVAL_MS)
})
