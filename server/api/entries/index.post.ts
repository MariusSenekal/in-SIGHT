// POST /api/entries
// Admin/staff creates a new service entry with optional initial tasks.
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin', 'staff'])
  const token = getBearerToken(event)!
  const { recordCode, notes, tasks } = await readBody<{
    recordCode: string
    notes?: string
    tasks?: string[]
  }>(event)

  if (!recordCode?.trim()) throw createError({ statusCode: 400, message: 'recordCode is required.' })

  const entryRows = await pgrest<any[]>('/service_entries', {
    method: 'POST',
    token,
    body: {
      record_code: recordCode.trim().toUpperCase(),
      start_time: new Date().toISOString(),
      notes: notes?.trim() ?? '',
      status: 'Not Done'
    },
    extraHeaders: { 'Prefer': 'return=representation' }
  })

  const entry = entryRows[0]

  // Insert initial tasks if provided
  if (tasks?.length) {
    const taskRows = tasks.map((task, i) => ({
      service_entry_id: entry.id,
      task: task.trim(),
      completed: false,
      sort_order: i
    }))
    await pgrest('/service_tasks', {
      method: 'POST',
      token,
      body: taskRows,
      extraHeaders: { 'Prefer': 'return=minimal' }
    })
  }

  return { id: entry.id, recordCode: entry.record_code, status: entry.status, startTime: entry.start_time }
})
