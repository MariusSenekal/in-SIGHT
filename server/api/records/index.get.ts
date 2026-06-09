// GET /api/records
// Returns all records visible to the authenticated user (RLS-filtered).
import { requireAuth, pgrest, pgrestAdmin, getBearerToken } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)
  const token = getBearerToken(event)!
  const currentUserId = Number(payload.sub)

  const query: Record<string, string> = { order: 'id.desc' }
  let companyIds: number[] = []

  if (payload.app_role !== 'admin') {
    const membership = await pgrestAdmin<Array<{ company_id: number }>>('/company_users', {
      query: {
        user_id: `eq.${payload.sub}`,
        select: 'company_id'
      }
    })

    companyIds = (membership ?? [])
      .map(m => Number(m.company_id))
      .filter((id) => Number.isFinite(id))

    if (companyIds.length > 0) {
      query.or = `(owner_user_id.eq.${payload.sub},owner_company_id.in.(${companyIds.join(',')}))`
    } else {
      query.owner_user_id = `eq.${payload.sub}`
    }
  }

  const rows = await pgrest<any[]>('/records', {
    token,
    query
  })

  const visibleRows = payload.app_role === 'admin'
    ? rows
    : (rows ?? []).filter((r) => {
        const ownerUserId = r.owner_user_id == null ? null : Number(r.owner_user_id)
        const ownerCompanyId = r.owner_company_id == null ? null : Number(r.owner_company_id)

        if (companyIds.length > 0) {
          return (ownerUserId != null && ownerUserId === currentUserId)
            || (ownerCompanyId != null && companyIds.includes(ownerCompanyId))
        }

        return ownerUserId != null && ownerUserId === currentUserId
      })

  return visibleRows.map(r => ({
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
