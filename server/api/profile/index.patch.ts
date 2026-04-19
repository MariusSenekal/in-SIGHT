// PATCH /api/profile
// Updates the authenticated user's name and profile fields.
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)
  const token = getBearerToken(event)!
  const { displayName, phone, location, bio } = await readBody<{
    displayName: string
    phone: string
    location: string
    bio: string
  }>(event)

  if (!displayName?.trim()) {
    throw createError({ statusCode: 400, message: 'Display name is required.' })
  }

  // Update name on users table (RLS allows self-update)
  await pgrest('/users', {
    method: 'PATCH',
    token,
    body: { name: displayName.trim() },
    query: { id: `eq.${payload.sub}` },
    extraHeaders: { 'Prefer': 'return=minimal' }
  })

  // Upsert into user_profiles
  await pgrest('/user_profiles', {
    method: 'PATCH',
    token,
    body: {
      display_name: displayName.trim(),
      phone: phone?.trim() ?? '',
      location: location?.trim() ?? '',
      bio: bio?.trim() ?? ''
    },
    query: { user_id: `eq.${payload.sub}` },
    extraHeaders: { 'Prefer': 'return=minimal' }
  })

  return { ok: true }
})
