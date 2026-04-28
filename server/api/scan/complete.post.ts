// POST /api/scan/complete
// Staff, Cleaner, or UV Hero marks completion actions.
// Each button click creates a NEW service entry record with timestamp.
// This gives each action its own row in the service history table.
import { requireAuth, pgrestAdmin } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  // Only staff, cleaner, uv-hero roles may use this endpoint
  const authPayload = requireAuth(event, ['staff', 'cleaner', 'uv-hero', 'admin'])
  const userId = parseInt(authPayload.sub, 10)
  const userRole = authPayload.app_role // Store the user's role at the time of action

  const { recordCode, action, latitude, longitude } = await readBody<{
    recordCode: string
    action: 'check' | 'cleaning' | 'uv-check' | 'job-started' | 'job-completed'
    latitude?: number | null
    longitude?: number | null
  }>(event)

  if (!recordCode?.trim()) {
    throw createError({ statusCode: 400, message: 'recordCode is required.' })
  }
  const validActions = ['check', 'cleaning', 'uv-check', 'job-started', 'job-completed']
  if (!validActions.includes(action)) {
    throw createError({ statusCode: 400, message: `action must be one of: ${validActions.join(', ')}` })
  }

  const code = recordCode.trim().toUpperCase()

  // Timestamp in Africa/Johannesburg (stored as UTC, formatted on read)
  const nowUtc = new Date().toISOString()

  // ────────────────────────────────────────────────────────────────────────────
  // CREATE A NEW SERVICE ENTRY FOR EACH BUTTON CLICK
  // This gives each action its own row in the service history table
  // ────────────────────────────────────────────────────────────────────────────
  
  // Build the new entry based on which button was clicked
  const entryData: any = {
    record_code: code,
    start_time: nowUtc,
    end_time: nowUtc,
    status: 'Done',
    notes: '',
    created_by: userId,
    created_by_role: userRole, // Store role at time of action
    latitude: latitude || null,
    longitude: longitude || null
  }

  // Set the appropriate completion timestamp based on action
  if (action === 'check') {
    entryData.check_completed_at = nowUtc
    entryData.notes = 'Check completed'
  } else if (action === 'cleaning') {
    entryData.cleaning_completed_at = nowUtc
    entryData.notes = 'Cleaning completed'
  } else if (action === 'uv-check') {
    entryData.uv_check_completed_at = nowUtc
    entryData.notes = 'UV check completed'
  } else if (action === 'job-started') {
    entryData.job_started_at = nowUtc
    entryData.notes = 'Job started'
  } else if (action === 'job-completed') {
    entryData.job_completed_at = nowUtc
    entryData.notes = 'Job completed'
  }

  const newEntry = await pgrestAdmin<any[]>('/service_entries', {
    method: 'POST',
    body: entryData,
    extraHeaders: { 'Prefer': 'return=representation' }
  })
  
  const entryId = newEntry[0].id
  console.log(`[complete.post] New service entry created: ${entryId} for action: ${action}`)

  // ────────────────────────────────────────────────────────────────────────────
  // INSERT COMPLETION HISTORY RECORD
  // Track every button click in the completion history table for audit purposes
  // ────────────────────────────────────────────────────────────────────────────
  try {
    await pgrestAdmin('/service_entry_completion_history', {
      method: 'POST',
      body: {
        service_entry_id: entryId,
        action_type: action,
        completed_at: nowUtc,
        completed_by: userId
      },
      extraHeaders: { 'Prefer': 'return=minimal' }
    })
    console.log(`[complete.post] Completion history record created: entry=${entryId}, action=${action}, user=${userId}`)
  } catch (historyError: any) {
    // Log the error but don't fail the request - the main update already succeeded
    console.error('[complete.post] Failed to insert completion history record:', historyError)
  }
  // ────────────────────────────────────────────────────────────────────────────

  // Return the formatted Johannesburg time for immediate UI display
  const formatted = new Date(nowUtc).toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  return { 
    ok: true, 
    entryId, 
    timestamp: formatted
  }
})
