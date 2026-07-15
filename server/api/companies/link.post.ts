// POST /api/companies/link
// Links or unlinks a user to/from a company.
// Body: { companyId, userId, action: 'link' | 'unlink' }
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event, ['admin', 'staff', 'cleaner', 'uv-hero', 'client_admin'])
  const token = getBearerToken(event)!
  const { companyId, userId, action } = await readBody<{
    companyId: number
    userId: number
    action: 'link' | 'unlink'
  }>(event)

  if (!companyId || !userId) {
    throw createError({ statusCode: 400, message: 'companyId and userId are required.' })
  }

  // Client admins can only manage memberships for companies they belong to.
  if (payload.app_role === 'client_admin') {
    const myCompanyRows = await pgrest<Array<{ company_id: number }>>('/company_users', {
      token,
      query: {
        select: 'company_id',
        user_id: `eq.${payload.sub}`
      }
    })

    const myCompanyIds = new Set((myCompanyRows ?? []).map(r => Number(r.company_id)))
    if (!myCompanyIds.has(Number(companyId))) {
      throw createError({ statusCode: 403, message: 'You can only manage users in your own company.' })
    }
  }

  if (action === 'unlink') {
    await pgrest('/company_users', {
      method: 'DELETE',
      token,
      query: { company_id: `eq.${companyId}`, user_id: `eq.${userId}` }
    })
  } else {
    try {
      await pgrest('/company_users', {
        method: 'POST',
        token,
        body: { company_id: companyId, user_id: userId },
        extraHeaders: { 'Prefer': 'return=minimal' }
      })
    } catch {
      // Ignore unique constraint violation (already linked)
    }
  }

  return { ok: true }
})
