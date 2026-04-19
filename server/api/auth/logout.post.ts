// POST /api/auth/logout
// Revokes the current JWT by inserting its jti into revoked_tokens.
import { requireAuth } from '../../utils/pgrest'
import { pgrestAdmin } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)

  try {
    await pgrestAdmin('/rpc/revoke_token', {
      method: 'POST',
      body: {
        in_jti: payload.jti,
        in_expires_at: new Date(payload.exp * 1000).toISOString()
      }
    })
  } catch {
    // Non-fatal: if revocation fails the token expires naturally (15 min)
  }

  return { ok: true }
})
