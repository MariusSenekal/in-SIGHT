// POST /api/scan/complete
// Staff, Cleaner, or UV Hero marks completion actions
// on the most recent service entry for a given record code.
// Records the Africa/Johannesburg timestamp of the button press.
import { requireAuth, pgrestAdmin } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  // Only staff, cleaner, uv-hero roles may use this endpoint
  requireAuth(event, ['staff', 'cleaner', 'uv-hero', 'admin'])

  const { recordCode, action } = await readBody<{
    recordCode: string
    action: 'check' | 'cleaning' | 'uv-check' | 'job-started' | 'job-completed'
  }>(event)

  if (!recordCode?.trim()) {
    throw createError({ statusCode: 400, message: 'recordCode is required.' })
  }
  const validActions = ['check', 'cleaning', 'uv-check', 'job-started', 'job-completed']
  if (!validActions.includes(action)) {
    throw createError({ statusCode: 400, message: `action must be one of: ${validActions.join(', ')}` })
  }

  const code = recordCode.trim().toUpperCase()

  // Find the most recent service entry for this record
  let entries = await pgrestAdmin<any[]>('/service_entries', {
    query: {
      record_code: `eq.${code}`,
      select: 'id',
      order:  'id.desc',
      limit:  '1'
    }
  })

  let entryId: number

  // If no entry exists, create one automatically
  if (!entries?.length) {
    const newEntry = await pgrestAdmin<any[]>('/service_entries', {
      method: 'POST',
      body: {
        record_code: code,
        start_time: new Date().toISOString(),
        notes: 'Auto-created on completion button press',
        status: 'Not Done'
      },
      extraHeaders: { 'Prefer': 'return=representation' }
    })
    entryId = newEntry[0].id
  } else {
    entryId = entries[0].id
  }

  // Timestamp in Africa/Johannesburg (stored as UTC, formatted on read)
  const nowUtc = new Date().toISOString()

  // Fetch current entry to check completion status
  const currentEntry = await pgrestAdmin<any[]>(`/service_entries?id=eq.${entryId}`, {
    query: { select: 'check_completed_at,cleaning_completed_at,uv_check_completed_at,job_started_at,job_completed_at,end_time' }
  })

  const entry = currentEntry[0]
  const isCheckAlreadyDone = !!entry.check_completed_at
  const isCleaningAlreadyDone = !!entry.cleaning_completed_at
  const isUvCheckAlreadyDone = !!entry.uv_check_completed_at
  const isJobStartedAlreadyDone = !!entry.job_started_at
  const isJobCompletedAlreadyDone = !!entry.job_completed_at

  // Build patch object based on action
  const patch: any = {}
  let willBothBeCompleted = false

  if (action === 'check') {
    patch.check_completed_at = nowUtc
    willBothBeCompleted = isCleaningAlreadyDone
  } else if (action === 'cleaning') {
    patch.cleaning_completed_at = nowUtc
    willBothBeCompleted = isCheckAlreadyDone
  } else if (action === 'uv-check') {
    patch.uv_check_completed_at = nowUtc
    // UV Hero: all three tasks must be complete
    willBothBeCompleted = isJobStartedAlreadyDone && isJobCompletedAlreadyDone
  } else if (action === 'job-started') {
    patch.job_started_at = nowUtc
    willBothBeCompleted = isUvCheckAlreadyDone && isJobCompletedAlreadyDone
  } else if (action === 'job-completed') {
    patch.job_completed_at = nowUtc
    willBothBeCompleted = isUvCheckAlreadyDone && isJobStartedAlreadyDone
  }

  console.log(`[complete.post] Entry ${entryId} - Action: ${action}, All complete: ${willBothBeCompleted}`)

  // If this completes all required tasks, update end_time and status to Done
  if (willBothBeCompleted) {
    patch.end_time = nowUtc
    patch.status = 'Done'
    console.log('[complete.post] All tasks complete - setting end_time to:', nowUtc, 'and status=Done')
  }

  await pgrestAdmin(`/service_entries?id=eq.${entryId}`, {
    method: 'PATCH',
    extraHeaders: { Prefer: 'return=minimal' },
    body: patch
  })

  console.log(`[complete.post] Patch applied successfully. Entry ${entryId} updated with:`, JSON.stringify(patch))

  // Return the formatted Johannesburg time for immediate UI display
  const formatted = new Date(nowUtc).toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  return { 
    ok: true, 
    entryId, 
    timestamp: formatted,
    endTimeSet: willBothBeCompleted // true if both tasks are now complete
  }
})
