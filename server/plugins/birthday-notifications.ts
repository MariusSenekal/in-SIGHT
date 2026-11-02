// Sends a push notification to a record's OWNER ONLY (never their teammates
// or company) once a day for every client/staff birthday that's today or
// tomorrow. Runs in-process since the app is a long-lived container, not a
// serverless function — no external cron infra needed.
import { pgrestAdmin } from '../utils/pgrest'
import { getUpcomingBirthdays } from '../utils/birthdays'
import { sendPushToUser } from '../utils/push'

const CHECK_INTERVAL_MS = 15 * 60 * 1000
const TRIGGER_HOUR = 7 // local server time — don't push before 07:00

const todayDateString = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const hasRunToday = async (): Promise<boolean> => {
  const rows = await pgrestAdmin<any[]>('/notification_runs', {
    query: { run_date: `eq.${todayDateString()}`, kind: 'eq.birthday_push', select: 'run_date' }
  })
  return (rows?.length ?? 0) > 0
}

const markRunToday = async () => {
  await pgrestAdmin('/notification_runs', {
    method: 'POST',
    body: { run_date: todayDateString(), kind: 'birthday_push' },
    extraHeaders: { Prefer: 'resolution=ignore-duplicates' }
  }).catch(() => {})
}

const runBirthdayPushCheck = async () => {
  const [clients, staff] = await Promise.all([
    pgrestAdmin<any[]>('/clients', {
      query: { date_of_birth: 'not.is.null', owner_user_id: 'not.is.null', select: 'id,company_name,name,surname,date_of_birth,owner_user_id' }
    }),
    pgrestAdmin<any[]>('/staff_members', {
      query: { date_of_birth: 'not.is.null', owner_user_id: 'not.is.null', select: 'id,name,surname,date_of_birth,owner_user_id' }
    })
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
    const ownedClients = (clients ?? []).filter((c) => Number(c.owner_user_id) === ownerId)
    const ownedStaff = (staff ?? []).filter((s) => Number(s.owner_user_id) === ownerId)
    const birthdays = getUpcomingBirthdays(ownedClients, ownedStaff)
    if (birthdays.length === 0) continue

    const ownerName = nameById.get(ownerId) || 'your account'

    for (const bday of birthdays) {
      const label = bday.type === 'client' ? 'Client' : 'HR'
      await sendPushToUser(ownerId, {
        title: `🎂 Birthday ${bday.when}`,
        body: `${ownerName}'s account — ${label} record ${bday.name}'s birthday is ${bday.when}.`,
        tag: `birthday-${bday.type}-${bday.id}-${bday.when}`,
        url: bday.type === 'client' ? '/modules/clients' : '/modules/hr'
      })
    }
  }
}

const maybeRun = async () => {
  if (new Date().getHours() < TRIGGER_HOUR) return
  if (await hasRunToday()) return
  await runBirthdayPushCheck()
  await markRunToday()
}

export default defineNitroPlugin(() => {
  setTimeout(() => {
    maybeRun().catch((error) => console.error('[birthday-push] initial check failed', error))
  }, 30_000)

  setInterval(() => {
    maybeRun().catch((error) => console.error('[birthday-push] check failed', error))
  }, CHECK_INTERVAL_MS)
})
