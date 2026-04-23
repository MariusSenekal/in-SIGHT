// GET /api/companies
// Returns all companies with their linked user IDs. Admin and staff only.
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin', 'staff', 'cleaner', 'uv-hero'])
  const token = getBearerToken(event)!

  const rows = await pgrest<any[]>('/companies', {
    token,
    query: {
      select: 'id,name,created_at,company_users(user_id)',
      order: 'id.asc'
    }
  })

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
    linkedUserIds: (r.company_users ?? []).map((cu: any) => cu.user_id)
  }))
})
