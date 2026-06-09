// GET /api/equipment - List all equipment for the authenticated user's company
import { requireAuth, pgrestAdmin } from '~/server/utils/pgrest'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)
  const currentUserId = Number(payload.sub)

  try {
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
    }

    const rows = (await pgrestAdmin<any[]>('/equipment', {
      query: {
        select: '*',
        order: 'created_at.desc'
      }
    })) || []

    if (payload.app_role === 'admin') return rows

    return rows.filter((r: any) => {
      const ownerUserId = r.owner_user_id == null ? null : Number(r.owner_user_id)
      const ownerCompanyId = r.owner_company_id == null ? null : Number(r.owner_company_id)

      if (companyIds.length > 0) {
        return (ownerUserId != null && ownerUserId === currentUserId)
          || (ownerCompanyId != null && companyIds.includes(ownerCompanyId))
      }

      return ownerUserId != null && ownerUserId === currentUserId
    })
  } catch (error: unknown) {
    console.error('[API] Failed to fetch equipment:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch equipment.' })
  }
})
