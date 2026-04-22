// POST /api/companies/link
// Links or unlinks a user to/from a company.
// Body: { companyId, userId, action: 'link' | 'unlink' }
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin', 'staff', 'cleaner'])
  const token = getBearerToken(event)!
  const { companyId, userId, action } = await readBody<{
    companyId: number
    userId: number
    action: 'link' | 'unlink'
  }>(event)

  if (!companyId || !userId) {
    throw createError({ statusCode: 400, message: 'companyId and userId are required.' })
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
