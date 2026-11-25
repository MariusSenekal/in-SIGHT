// Daily check for client-record date reminders: next service due and
// contract renewal, each fired at 90, 30 and 1 day(s) before the date.
// Delivered to the client's OWNER ONLY, the same way birthdays are (see
// birthday-notifications.ts): a push notification (works even logged out)
// and an in-app notification row, live-pushed over the owner's socket room
// if they have a tab open right now. Runs in-process on its own daily gate,
// independent of the birthday check, since the app is a long-lived
// container, not a serverless function.
import { pgrestAdmin } from '../utils/pgrest'
import { getDueReminders } from '../utils/clientReminders'
import { sendPushToUser } from '../utils/push'
import { createNotification } from '../utils/notifications'

const CHECK_INTERVAL_MS = 15 * 60 * 1000
const TRIGGER_HOUR = 8 // server runs UTC; 08:00 UTC = 10:00 SAST — don't notify before then
const RUN_KIND = 'client_date_reminders'

const todayDateString = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const hasRunToday = async (): Promise<boolean> => {
  const rows = await pgrestAdmin<any[]>('/notification_runs', {
    query: { run_date: `eq.${todayDateString()}`, kind: `eq.${RUN_KIND}`, select: 'run_date' }
  })
  return (rows?.length ?? 0) > 0
}

const markRunToday = async () => {
  await pgrestAdmin('/notification_runs', {
    method: 'POST',
    body: { run_date: todayDateString(), kind: RUN_KIND },
    extraHeaders: { Prefer: 'resolution=ignore-duplicates' }
  }).catch(() => {})
}

const intervalLabel = (days: number) => (days === 1 ? 'tomorrow' : `in ${days} days`)

const runClientReminderCheck = async () => {
  const clients = await pgrestAdmin<any[]>('/clients', {
    query: {
      owner_user_id: 'not.is.null',
      select: 'id,company_name,name,surname,next_service_due,contract_renewal_date,owner_user_id'
    }
  })

  if (!clients?.length) return

  const reminders = getDueReminders(clients)

  for (const reminder of reminders) {
    const client = clients.find((c) => Number(c.id) === reminder.clientId)
    const ownerId = client ? Number(client.owner_user_id) : null
    if (!ownerId) continue

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
}

const maybeRun = async () => {
  if (new Date().getHours() < TRIGGER_HOUR) return
  if (await hasRunToday()) return
  await runClientReminderCheck()
  await markRunToday()
}

export default defineNitroPlugin(() => {
  setTimeout(() => {
    maybeRun().catch((error) => console.error('[client-reminders] initial check failed', error))
  }, 45_000)

  setInterval(() => {
    maybeRun().catch((error) => console.error('[client-reminders] check failed', error))
  }, CHECK_INTERVAL_MS)
})
