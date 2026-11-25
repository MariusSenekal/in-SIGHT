// Computes which clients have a next-service-due or contract-renewal date
// landing on one of the user's configured reminder intervals (days out) from
// today. Mirrors birthdays.ts's date-safe parsing -- dates are bare
// "YYYY-MM-DD" strings compared by whole days only, never through
// Date-based UTC math, so no timezone can shift which day a reminder fires.

export type ReminderKind = 'next_service_due' | 'contract_renewal'

// Historical default, used when a user has no saved preference row.
export const REMINDER_INTERVALS_DAYS = [90, 30, 1] as const

export interface ClientReminder {
  kind: ReminderKind
  intervalDays: number
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

// intervalsByKind lets each client's owner have their own set of days-before
// to be reminded at, per type -- falls back to the historical 90/30/1 when a
// kind is missing (user never saved a preference).
export const getDueReminders = (
  clients: ClientRow[],
  intervalsByKind?: Partial<Record<ReminderKind, readonly number[]>>
): ClientReminder[] => {
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
      const allowedIntervals = intervalsByKind?.[kind] ?? REMINDER_INTERVALS_DAYS
      const interval = allowedIntervals.find((days) => days === diff)
      if (interval === undefined) continue

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
