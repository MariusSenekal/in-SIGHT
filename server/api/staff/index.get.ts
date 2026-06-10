// GET /api/staff - List all staff members (admin/staff only)
import { pgrestAdmin } from '~/server/utils/pgrest'
import { verifyJwt } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'Missing or invalid token.' })
  }

  const token = authHeader.substring(7)
  const config = useRuntimeConfig()
  const payload = verifyJwt(token, config.jwtSecret as string)
  if (!payload) {
    throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
  }

  const isAdminOrStaff = payload.app_role === 'admin' || payload.app_role === 'staff' || payload.app_role === 'client_admin'
  if (!isAdminOrStaff) {
    throw createError({ statusCode: 403, message: 'Access denied.' })
  }

  try {
    const staff = await pgrestAdmin<any[]>('/staff_members', {
      query: { select: '*', order: 'surname.asc,name.asc' }
    })

    if (payload.app_role !== 'client_admin') return staff

    const memberships = await pgrestAdmin<Array<{ company_id: number }>>('/company_users', {
      query: {
        user_id: `eq.${payload.sub}`,
        select: 'company_id'
      }
    })
    const companyIds = (memberships ?? []).map(m => Number(m.company_id)).filter(Number.isFinite)
    const currentUserId = Number(payload.sub)

    return (staff ?? []).filter((member: any) => {
      const ownerUserId = member.owner_user_id == null ? null : Number(member.owner_user_id)
      const ownerCompanyId = member.owner_company_id == null ? null : Number(member.owner_company_id)

      if (companyIds.length > 0) {
        return (ownerUserId != null && ownerUserId === currentUserId)
          || (ownerCompanyId != null && companyIds.includes(ownerCompanyId))
      }

      return (ownerUserId != null && ownerUserId === currentUserId)
        || (ownerUserId == null && ownerCompanyId == null)
    })
  } catch (error: unknown) {
    console.error('[API] Failed to fetch staff members:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch staff members.' })
  }
})
