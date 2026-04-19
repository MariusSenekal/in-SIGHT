// GET /api/records/[code]
// Returns a single record by its QR code. Requires authentication.
import { requireAuth, pgrest, getBearerToken } from '../../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const token = getBearerToken(event)!
  const code = getRouterParam(event, 'code')!.trim().toUpperCase()

  const rows = await pgrest<any[]>('/records', {
    token,
    query: { code: `eq.${code}` }
  })

  if (!rows?.length) throw createError({ statusCode: 404, message: 'Record not found.' })
  const r = rows[0]

  return {
    id: r.id,
    code: r.code,
    name: r.name,
    description: r.description ?? '',
    type: r.type ?? '',
    location: r.location ?? '',
    ownerUserId: r.owner_user_id ?? null,
    ownerCompanyId: r.owner_company_id ?? null,
    createdAt: r.created_at
  }
})
