// server/utils/session.ts
// Database-backed login sessions (insight.user_sessions).
// The browser only ever holds an opaque random id in an HttpOnly cookie; the
// user's identity and role are read from the database on every request.
import type { H3Event } from 'h3'
import { createHash, randomBytes } from 'node:crypto'
import { pgrestAdmin } from './pgrest'

export const SESSION_COOKIE = 'insight_session'
// Sign-out after this much inactivity (the client warns one minute before).
export const SESSION_IDLE_SECONDS = 15 * 60
// Hard cap on a session's lifetime, regardless of activity.
const SESSION_MAX_SECONDS = 12 * 60 * 60
// Only write last_seen_at when it is older than this, to avoid a write per request.
const TOUCH_INTERVAL_SECONDS = 60

export interface SessionUser {
  sessionId: string
  id: number
  name: string
  username: string
  role: string
}

interface SessionRow {
  id: string
  last_seen_at: string
  expires_at: string
  users: { id: number; name: string; username: string; role: string; is_active: boolean } | null
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

const cookieOptions = (event: H3Event) => ({
  httpOnly: true,
  secure: getRequestProtocol(event, { xForwardedProto: true }) === 'https',
  sameSite: 'strict' as const,
  path: '/'
})

/** Create a session row for a freshly authenticated user and set the cookie. */
export const createSession = async (event: H3Event, userId: number): Promise<string> => {
  const token = randomBytes(32).toString('base64url')
  const rows = await pgrestAdmin<{ id: string }[]>('/user_sessions', {
    method: 'POST',
    body: {
      user_id: userId,
      token_hash: hashToken(token),
      user_agent: (getRequestHeader(event, 'user-agent') ?? '').slice(0, 500),
      ip_address: getRequestIP(event, { xForwardedFor: true }) ?? '',
      expires_at: new Date(Date.now() + SESSION_MAX_SECONDS * 1000).toISOString()
    },
    extraHeaders: { Prefer: 'return=representation' }
  })
  setCookie(event, SESSION_COOKIE, token, { ...cookieOptions(event), maxAge: SESSION_MAX_SECONDS })
  return rows[0].id
}

/**
 * Look up a raw session token. Returns the user when the session exists, is not
 * revoked, has not expired or gone idle, and the user is still active.
 */
export const resolveSessionToken = async (token: string | undefined): Promise<SessionUser | null> => {
  if (!token) return null
  const rows = await pgrestAdmin<SessionRow[]>('/user_sessions', {
    query: {
      token_hash: `eq.${hashToken(token)}`,
      revoked_at: 'is.null',
      select: 'id,last_seen_at,expires_at,users(id,name,username,role,is_active)'
    }
  })
  const row = rows[0]
  if (!row?.users?.is_active) return null

  const now = Date.now()
  const lastSeen = new Date(row.last_seen_at).getTime()
  if (new Date(row.expires_at).getTime() <= now || lastSeen + SESSION_IDLE_SECONDS * 1000 <= now) {
    return null
  }

  if (now - lastSeen >= TOUCH_INTERVAL_SECONDS * 1000) {
    await pgrestAdmin(`/user_sessions?id=eq.${row.id}`, {
      method: 'PATCH',
      body: { last_seen_at: new Date(now).toISOString() }
    })
  }

  return {
    sessionId: row.id,
    id: row.users.id,
    name: row.users.name,
    username: row.users.username,
    role: row.users.role
  }
}

/** Resolve the session for the current request from its cookie. */
export const resolveSession = (event: H3Event) => resolveSessionToken(getCookie(event, SESSION_COOKIE))

/** Revoke a session in the database and clear the cookie. */
export const revokeSession = async (event: H3Event, sessionId: string) => {
  await pgrestAdmin(`/user_sessions?id=eq.${sessionId}`, {
    method: 'PATCH',
    body: { revoked_at: new Date().toISOString() }
  })
  deleteCookie(event, SESSION_COOKIE, cookieOptions(event))
}

/** Read a cookie value from a raw Cookie header (used by Socket.io). */
export const readCookieHeader = (header: string | undefined, name: string): string | undefined => {
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return undefined
}
