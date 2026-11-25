export interface UpcomingBirthday {
  type: 'client' | 'staff'
  id: number
  name: string
  dateOfBirth: string
  when: 'today' | 'tomorrow'
  daysBefore: number
}

interface ClientRow {
  id: number
  company_name: string
  name: string
  surname: string
  date_of_birth: string | null
}

interface StaffRow {
  id: number
  name: string
  surname: string
  date_of_birth: string | null
}

// Parses a bare "YYYY-MM-DD" string without going through Date-based UTC
// parsing, so no timezone can ever shift which day it lands on.
const monthDay = (dateString: string): { month: number; day: number } | null => {
  const [, , m, d] = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? []
  if (!m || !d) return null
  return { month: Number(m), day: Number(d) }
}

// daysBefore lists how many days ahead of the birthday to notify at (0 =
// the day itself, 1 = the day before, etc.) -- defaults to the historical
// today+tomorrow behaviour when the caller has no saved preference.
export const DEFAULT_BIRTHDAY_DAYS_BEFORE = [0, 1] as const

export const getUpcomingBirthdays = (
  clients: ClientRow[],
  staff: StaffRow[],
  daysBefore: readonly number[] = DEFAULT_BIRTHDAY_DAYS_BEFORE
): UpcomingBirthday[] => {
  const now = new Date()
  const targets = daysBefore.map((offset) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
    return { offset, month: d.getMonth() + 1, day: d.getDate() }
  })

  const classify = (md: { month: number; day: number } | null): { when: 'today' | 'tomorrow'; daysBefore: number } | null => {
    if (!md) return null
    const match = targets.find((t) => t.month === md.month && t.day === md.day)
    if (!match) return null
    return { when: match.offset === 0 ? 'today' : 'tomorrow', daysBefore: match.offset }
  }

  const results: UpcomingBirthday[] = []

  for (const client of clients) {
    if (!client.date_of_birth) continue
    const match = classify(monthDay(client.date_of_birth))
    if (!match) continue
    const contactName = [client.name, client.surname].filter(Boolean).join(' ')
    results.push({
      type: 'client',
      id: client.id,
      name: contactName || client.company_name,
      dateOfBirth: client.date_of_birth,
      when: match.when,
      daysBefore: match.daysBefore
    })
  }

  for (const member of staff) {
    if (!member.date_of_birth) continue
    const match = classify(monthDay(member.date_of_birth))
    if (!match) continue
    results.push({
      type: 'staff',
      id: member.id,
      name: [member.name, member.surname].filter(Boolean).join(' '),
      dateOfBirth: member.date_of_birth,
      when: match.when,
      daysBefore: match.daysBefore
    })
  }

  return results
}
