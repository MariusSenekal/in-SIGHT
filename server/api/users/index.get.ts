// GET /api/users
// Returns all users with embedded profiles. Admin, staff, and client_admin can access.
// client_admin only sees users in their own company (enforced by RLS)
import { requireAuth, pgrest } from '../../utils/pgrest'
import { getBearerToken } from '../../utils/pgrest'
import { pgrestAdmin } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event, ['admin', 'staff', 'cleaner', 'uv-hero', 'client_admin'])
  const token = getBearerToken(event)!

  if (payload.app_role === 'client_admin') {
    const myCompanyRows = await pgrestAdmin<Array<{ company_id: number }>>('/company_users', {
      query: {
        select: 'company_id',
        user_id: `eq.${payload.sub}`
      }
    })

    const myCompanyIds = [...new Set((myCompanyRows ?? []).map(r => Number(r.company_id)))]
    if (!myCompanyIds.length) {
      return []
    }

    const companyIdFilter = `in.(${myCompanyIds.join(',')})`
    const linkedRows = await pgrestAdmin<Array<{ user_id: number }>>('/company_users', {
      query: {
        select: 'user_id',
        company_id: companyIdFilter
      }
    })

    const linkedUserIds = [...new Set((linkedRows ?? []).map(r => Number(r.user_id)))]
    if (!linkedUserIds.length) {
      return []
    }

    const userIdFilter = `in.(${linkedUserIds.join(',')})`
    const rows = await pgrestAdmin<any[]>('/users', {
      query: {
        select: 'id,name,username,role,is_active,created_at,user_profiles(display_name,phone,location,bio)',
        id: userIdFilter
      }
    })

    return rows.map(r => ({
      id: r.id,
      name: r.name,
      username: r.username,
      role: r.role,
      isActive: r.is_active,
      createdAt: r.created_at,
      profile: r.user_profiles
        ? {
            displayName: r.user_profiles.display_name ?? r.name,
            phone: r.user_profiles.phone ?? '',
            location: r.user_profiles.location ?? '',
            bio: r.user_profiles.bio ?? '',
            createdAt: r.user_profiles.created_at ?? r.created_at
          }
        : { displayName: r.name, phone: '', location: '', bio: '', createdAt: r.created_at }
    }))
  }

  const rows = await pgrest<any[]>('/users', {
    token,
    query: {
      select: 'id,name,username,role,is_active,created_at,user_profiles(display_name,phone,location,bio)'
    }
  })

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    username: r.username,
    role: r.role,
    isActive: r.is_active,
    createdAt: r.created_at,
    profile: r.user_profiles
      ? {
          displayName: r.user_profiles.display_name ?? r.name,
          phone: r.user_profiles.phone ?? '',
          location: r.user_profiles.location ?? '',
          bio: r.user_profiles.bio ?? '',
          createdAt: r.user_profiles.created_at ?? r.created_at
        }
      : { displayName: r.name, phone: '', location: '', bio: '', createdAt: r.created_at }
  }))
})
