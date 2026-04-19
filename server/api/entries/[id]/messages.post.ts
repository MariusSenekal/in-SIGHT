// POST /api/entries/[id]/messages
// Add a message to a service entry.
import { requireAuth, pgrest, pgrestAdmin, getBearerToken } from '../../../utils/pgrest'

export default defineEventHandler(async (event) => {
  const entryId = getRouterParam(event, 'id')!
  const { text, fromRole, fromName, isAnon } = await readBody<{
    text: string
    fromRole: string
    fromName: string
    isAnon?: boolean
  }>(event)

  if (!text?.trim()) throw createError({ statusCode: 400, message: 'Message text is required.' })

  const validRoles = ['admin', 'staff', 'site-user']
  if (!validRoles.includes(fromRole)) {
    throw createError({ statusCode: 400, message: 'Invalid fromRole.' })
  }

  const body = {
    service_entry_id: Number(entryId),
    from_role: fromRole,
    from_name: fromName?.trim() || 'Anonymous',
    text: text.trim()
  }

  // Anon (site-user) messages use admin token; authenticated users use their token
  if (isAnon) {
    await pgrestAdmin('/service_messages', {
      method: 'POST',
      body,
      extraHeaders: { 'Prefer': 'return=minimal' }
    })
  } else {
    requireAuth(event)
    const token = getBearerToken(event)!
    await pgrest('/service_messages', {
      method: 'POST',
      token,
      body,
      extraHeaders: { 'Prefer': 'return=minimal' }
    })
  }

  return { ok: true }
})
