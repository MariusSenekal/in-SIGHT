import { createHmac, randomUUID } from 'node:crypto'

export interface JwtPayload {
  sub: string
  role: string      // DB role for PostgREST: insight_admin | insight_staff | insight_user
  app_role: string  // app role: admin | staff | user
  username: string
  name: string
  aud: string
  iat: number
  exp: number
  jti: string
}

const SESSION_SECONDS = 15 * 60

const toB64 = (s: string) => Buffer.from(s).toString('base64url')
const fromB64 = (s: string) => Buffer.from(s, 'base64url').toString()
const HEADER = toB64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))

const dbRole = (appRole: string) => {
  if (appRole === 'admin') return 'insight_admin'
  if (appRole === 'staff' || appRole === 'cleaner' || appRole === 'uv-hero') return 'insight_staff'
  return 'insight_user'
}

export const signJwt = (
  userId: number,
  name: string,
  username: string,
  appRole: string,
  secret: string,
  durationSeconds = SESSION_SECONDS
): string => {
  const iat = Math.floor(Date.now() / 1000)
  const payload: JwtPayload = {
    sub: String(userId),
    role: dbRole(appRole),
    app_role: appRole,
    username,
    name,
    aud: 'insight',
    iat,
    exp: iat + durationSeconds,
    jti: randomUUID()
  }
  const body = toB64(JSON.stringify(payload))
  const sig = createHmac('sha256', secret).update(`${HEADER}.${body}`).digest('base64url')
  return `${HEADER}.${body}.${sig}`
}

export const verifyJwt = (token: string, secret: string): JwtPayload | null => {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sig] = parts
  const expected = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  if (sig !== expected) return null
  try {
    const payload = JSON.parse(fromB64(body)) as JwtPayload
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

/** Decode without verifying – safe for reading claims the client already has */
export const decodePayload = (token: string): JwtPayload | null => {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    return JSON.parse(fromB64(parts[1])) as JwtPayload
  } catch {
    return null
  }
}

/** Short-lived admin token for internal server→PostgREST calls */
export const makeServerAdminToken = (secret: string): string =>
  signJwt(1, 'System', 'system', 'admin', secret, 60)
