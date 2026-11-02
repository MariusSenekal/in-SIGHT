// GET /api/birthdays/upcoming - Clients/HR records with a birthday today or
// tomorrow, OWNED BY THE CURRENT USER ONLY. Deliberately not scoped by
// company — each user only ever sees birthdays for records they themselves
// created, never a teammate's.
import { requireAuth, pgrestAdmin } from '~/server/utils/pgrest'
import { getUpcomingBirthdays } from '~/server/utils/birthdays'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)
  const userId = Number(payload.sub)

  const [clients, staff] = await Promise.all([
    pgrestAdmin<Array<{ id: number; company_name: string; name: string; surname: string; date_of_birth: string | null }>>('/clients', {
      query: { owner_user_id: `eq.${userId}`, select: 'id,company_name,name,surname,date_of_birth' }
    }),
    pgrestAdmin<Array<{ id: number; name: string; surname: string; date_of_birth: string | null }>>('/staff_members', {
      query: { owner_user_id: `eq.${userId}`, select: 'id,name,surname,date_of_birth' }
    })
  ])

  return getUpcomingBirthdays(clients ?? [], staff ?? [])
})
