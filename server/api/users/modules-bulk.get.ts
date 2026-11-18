// GET /api/users/modules-bulk
// Returns every user's module permissions in one call: { userId: string[] }.
// Used by admin bulk-import (and similar) to filter a user picker down to
// "who actually has access to this module" without an N+1 fetch per user.
// Admin-only - the per-user endpoint already covers self/client_admin cases.
import { requireAuth, pgrestAdmin } from '~/server/utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin'])

  const rows = await pgrestAdmin<Array<{ user_id: number; module: string }>>('/user_module_permissions', {
    query: { select: 'user_id,module' }
  })

  const byUser: Record<number, string[]> = {}
  for (const row of rows ?? []) {
    const userId = Number(row.user_id)
    if (!byUser[userId]) byUser[userId] = []
    byUser[userId].push(row.module)
  }

  return byUser
})
