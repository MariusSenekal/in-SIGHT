// PATCH /api/entries/[id]/tasks/[taskId]
// Toggle a task's completed state. Staff/admin or authenticated user.
import { requireAuth, pgrest, getBearerToken } from '../../../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const token = getBearerToken(event)!
  const taskId = getRouterParam(event, 'taskId')!
  const { completed } = await readBody<{ completed: boolean }>(event)

  await pgrest('/service_tasks', {
    method: 'PATCH',
    token,
    body: { completed },
    query: { id: `eq.${taskId}` },
    extraHeaders: { 'Prefer': 'return=minimal' }
  })

  return { ok: true }
})
