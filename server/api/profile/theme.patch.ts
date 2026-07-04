// PATCH /api/profile/theme
// Updates the authenticated user's theme preference
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)
  const token = getBearerToken(event)!
  const { theme } = await readBody<{ theme: string }>(event)

  if (!theme?.trim()) {
    throw createError({ statusCode: 400, message: 'Theme is required.' })
  }

  // Update theme in user_profiles
  await pgrest('/user_profiles', {
    method: 'PATCH',
    token,
    body: { theme: theme.trim() },
    query: { user_id: `eq.${payload.sub}` },
    extraHeaders: { 'Prefer': 'return=minimal' }
  })

  return { ok: true }
})
