// POST /api/companies
// Admin/staff creates a new company.
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin', 'staff', 'cleaner'])
  const token = getBearerToken(event)!
  const { name } = await readBody<{ name: string }>(event)

  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Company name is required.' })

  const rows = await pgrest<any[]>('/companies', {
    method: 'POST',
    token,
    body: { name: name.trim() },
    extraHeaders: { 'Prefer': 'return=representation' }
  })

  const r = rows[0]
  return { id: r.id, name: r.name, createdAt: r.created_at, linkedUserIds: [] }
})
