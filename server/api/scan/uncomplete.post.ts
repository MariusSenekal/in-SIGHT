// POST /api/scan/uncomplete
// Staff, Cleaner, or UV Hero removes a completion timestamp from a service entry.
// Recalculates entry status and clears end_time if it was previously Done.
import { requireAuth, pgrestAdmin } from '../../utils/pgrest'

type UncompleteAction = 'check' | 'cleaning' | 'uv-check' | 'job-started' | 'job-completed'

const columnMap: Record<UncompleteAction, string> = {
  'check':        'check_completed_at',
  'cleaning':     'cleaning_completed_at',
  'uv-check':     'uv_check_completed_at',
  'job-started':  'job_started_at',
  'job-completed':'job_completed_at'
}

export default defineEventHandler(async (event) => {
  requireAuth(event, ['staff', 'cleaner', 'uv-hero', 'admin'])

  const { entryId, action } = await readBody<{ entryId: number; action: UncompleteAction }>(event)

  if (!entryId || typeof entryId !== 'number') {
    throw createError({ statusCode: 400, message: 'entryId is required.' })
  }

  const validActions: UncompleteAction[] = ['check', 'cleaning', 'uv-check', 'job-started', 'job-completed']
  if (!validActions.includes(action)) {
    throw createError({ statusCode: 400, message: `action must be one of: ${validActions.join(', ')}` })
  }

  const col = columnMap[action]

  // Fetch current entry
  const entries = await pgrestAdmin<any[]>('/service_entries', {
    query: {
      id: `eq.${entryId}`,
      select: 'id,check_completed_at,cleaning_completed_at,uv_check_completed_at,job_started_at,job_completed_at'
    }
  })

  if (!entries?.length) throw createError({ statusCode: 404, message: 'Entry not found.' })

  const e = entries[0]

  // Determine status after clearing this column
  const remaining = {
    check_completed_at:     col === 'check_completed_at'     ? null : e.check_completed_at,
    cleaning_completed_at:  col === 'cleaning_completed_at'  ? null : e.cleaning_completed_at,
    uv_check_completed_at:  col === 'uv_check_completed_at'  ? null : e.uv_check_completed_at,
    job_started_at:         col === 'job_started_at'         ? null : e.job_started_at,
    job_completed_at:       col === 'job_completed_at'       ? null : e.job_completed_at
  }

  const anySet = Object.values(remaining).some(v => v !== null)
  const newStatus = anySet ? 'Incomplete' : 'Not Done'

  await pgrestAdmin(`/service_entries?id=eq.${entryId}`, {
    method: 'PATCH',
    extraHeaders: { Prefer: 'return=minimal' },
    body: {
      [col]:     null,
      end_time:  null,
      status:    newStatus
    }
  })

  return { ok: true, status: newStatus }
})
