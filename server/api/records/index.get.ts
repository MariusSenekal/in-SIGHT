// GET /api/records
// Returns all records visible to the authenticated user (RLS-filtered).
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const token = getBearerToken(event)!

  const rows = await pgrest<any[]>('/records', {
    token,
    query: { order: 'id.desc' }
  })

  return rows.map(r => ({
    id: r.id,
    code: r.code,
    name: r.name,
    description: r.description ?? '',
    type: r.type ?? '',
    location: r.location ?? '',
    ownerUserId: r.owner_user_id ?? null,
    ownerCompanyId: r.owner_company_id ?? null,
    createdAt: r.created_at
  }))
})
