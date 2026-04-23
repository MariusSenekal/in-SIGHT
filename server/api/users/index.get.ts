// GET /api/users
// Returns all users with embedded profiles. Admin and staff only.
import { requireAuth, pgrest } from '../../utils/pgrest'
import { getBearerToken } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event, ['admin', 'staff', 'cleaner', 'uv-hero'])
  const token = getBearerToken(event)!

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
