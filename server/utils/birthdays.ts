export interface UpcomingBirthday {
  type: 'client' | 'staff'
  id: number
  name: string
  dateOfBirth: string
  when: 'today' | 'tomorrow'
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
  const [, m, d] = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? []
  if (!m || !d) return null
  return { month: Number(m), day: Number(d) }
}

export const getUpcomingBirthdays = (
  clients: ClientRow[],
  staff: StaffRow[]
): UpcomingBirthday[] => {
  const now = new Date()
  const today = { month: now.getMonth() + 1, day: now.getDate() }
  const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const tomorrow = { month: tomorrowDate.getMonth() + 1, day: tomorrowDate.getDate() }

  const classify = (md: { month: number; day: number } | null): 'today' | 'tomorrow' | null => {
    if (!md) return null
    if (md.month === today.month && md.day === today.day) return 'today'
    if (md.month === tomorrow.month && md.day === tomorrow.day) return 'tomorrow'
    return null
  }

  const results: UpcomingBirthday[] = []

  for (const client of clients) {
    if (!client.date_of_birth) continue
    const when = classify(monthDay(client.date_of_birth))
    if (!when) continue
    const contactName = [client.name, client.surname].filter(Boolean).join(' ')
    results.push({
      type: 'client',
      id: client.id,
      name: contactName || client.company_name,
      dateOfBirth: client.date_of_birth,
      when
    })
  }

  for (const member of staff) {
    if (!member.date_of_birth) continue
    const when = classify(monthDay(member.date_of_birth))
    if (!when) continue
    results.push({
      type: 'staff',
      id: member.id,
      name: [member.name, member.surname].filter(Boolean).join(' '),
      dateOfBirth: member.date_of_birth,
      when
    })
  }

  return results
}
