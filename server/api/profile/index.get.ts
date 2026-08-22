// GET /api/profile
// Returns the authenticated user's full profile.
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)
  const token = getBearerToken(event)!

  const rows = await pgrest<any[]>('/users', {
    token,
    query: {
      id: `eq.${payload.sub}`,
      select: 'id,name,username,role,is_active,created_at,user_profiles(display_name,phone,location,bio,theme,created_at)'
    }
  })

  if (!rows?.length) throw createError({ statusCode: 404, message: 'User not found.' })
  const r = rows[0]

  return {
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
          theme: r.user_profiles.theme ?? 'inSight',
          createdAt: r.user_profiles.created_at ?? r.created_at
        }
      : { displayName: r.name, phone: '', location: '', bio: '', theme: 'inSight', createdAt: r.created_at }
  }
})
