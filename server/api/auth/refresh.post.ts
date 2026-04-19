// POST /api/auth/refresh
// Issues a new JWT for the same user if their current token is still valid.
import { requireAuth } from '../../utils/pgrest'
import { signJwt } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)
  const config = useRuntimeConfig()
  const token = signJwt(Number(payload.sub), payload.name, payload.username, payload.app_role, config.jwtSecret as string)
  return { token }
})
