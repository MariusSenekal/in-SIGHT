// Computes which clients have a next-service-due or contract-renewal date
// landing on one of the reminder intervals (90, 30 or 1 day(s) out) from
// today. Mirrors birthdays.ts's date-safe parsing -- dates are bare
// "YYYY-MM-DD" strings compared by whole days only, never through
// Date-based UTC math, so no timezone can shift which day a reminder fires.

export type ReminderKind = 'next_service_due' | 'contract_renewal'

export const REMINDER_INTERVALS_DAYS = [90, 30, 1] as const
export type ReminderInterval = (typeof REMINDER_INTERVALS_DAYS)[number]

export interface ClientReminder {
  kind: ReminderKind
  intervalDays: ReminderInterval
  clientId: number
  clientName: string
  dueDate: string
}

interface ClientRow {
  id: number
  company_name: string
  name: string
  surname: string
  next_service_due: string | null
  contract_renewal_date: string | null
}

const daysBetween = (dateString: string): number | null => {
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const [, y, m, d] = match
  // UTC midnight for both sides keeps this a pure whole-day difference,
  // immune to DST shifts local time would introduce.
  const due = Date.UTC(Number(y), Number(m) - 1, Number(d))
  const now = new Date()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((due - today) / 86_400_000)
}

const clientLabel = (client: ClientRow): string => {
  const contact = [client.name, client.surname].filter(Boolean).join(' ')
  return client.company_name || contact
}

export const getDueReminders = (clients: ClientRow[]): ClientReminder[] => {
  const results: ClientReminder[] = []

  for (const client of clients) {
    const checks: Array<[ReminderKind, string | null]> = [
      ['next_service_due', client.next_service_due],
      ['contract_renewal', client.contract_renewal_date]
    ]

    for (const [kind, dateValue] of checks) {
      if (!dateValue) continue
      const diff = daysBetween(dateValue)
      if (diff === null) continue
      const interval = REMINDER_INTERVALS_DAYS.find((days) => days === diff)
      if (!interval) continue

      results.push({
        kind,
        intervalDays: interval,
        clientId: client.id,
        clientName: clientLabel(client),
        dueDate: dateValue
      })
    }
  }

  return results
}
