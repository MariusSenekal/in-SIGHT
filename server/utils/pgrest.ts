import type { H3Event } from 'h3'
import { verifyJwt, makeServerAdminToken, type JwtPayload } from './jwt'

/**
 * Verify the Bearer token on a request and return the payload.
 * Throws 401/403 if missing, invalid, or wrong role.
 */
export const requireAuth = (event: H3Event, allowedRoles?: string[]): JwtPayload => {
  const auth = getHeader(event, 'authorization') ?? ''
  if (!auth.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'Authentication required.' })
  }
  const config = useRuntimeConfig()
  const payload = verifyJwt(auth.slice(7), config.jwtSecret as string)
  if (!payload) {
    throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
  }
  if (allowedRoles && !allowedRoles.includes(payload.app_role)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions.' })
  }
  return payload
}

/**
 * Extract the raw Bearer token from the request without verifying.
 * For forwarding the user's JWT directly to PostgREST.
 */
export const getBearerToken = (event: H3Event): string | null => {
  const auth = getHeader(event, 'authorization') ?? ''
  return auth.startsWith('Bearer ') ? auth.slice(7) : null
}

/**
 * Call PostgREST with a given Bearer token.
 * The base URL comes from NUXT_PGREST_URL (server-side only).
 */
export const pgrest = async <T = unknown>(
  path: string,
  options: {
    method?: string
    token: string
    body?: unknown
    query?: Record<string, string>
    extraHeaders?: Record<string, string>
  }
): Promise<T> => {
  const config = useRuntimeConfig()
  const base = config.pgrestUrl as string

  const url = new URL(`${base}${path}`)
  if (options.query) {
    Object.entries(options.query).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  return $fetch<T>(url.toString(), {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${options.token}`,
      ...options.extraHeaders
    },
    body: options.body !== undefined ? options.body : undefined
  })
}

/** Convenience: PostgREST call with a fresh server-admin token */
export const pgrestAdmin = async <T = unknown>(
  path: string,
  options: Omit<Parameters<typeof pgrest>[1], 'token'>
): Promise<T> => {
  const config = useRuntimeConfig()
  return pgrest<T>(path, { ...options, token: makeServerAdminToken(config.jwtSecret as string) })
}
