// POST /api/scan/complete
// Staff or Cleaner marks a "Check Completed" or "Cleaning Completed" action
// on the most recent service entry for a given record code.
// Records the Africa/Johannesburg timestamp of the button press.
import { requireAuth, pgrestAdmin } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  // Only staff and cleaner roles may use this endpoint
  requireAuth(event, ['staff', 'cleaner', 'admin'])

  const { recordCode, action } = await readBody<{
    recordCode: string
    action: 'check' | 'cleaning'
  }>(event)

  if (!recordCode?.trim()) {
    throw createError({ statusCode: 400, message: 'recordCode is required.' })
  }
  if (action !== 'check' && action !== 'cleaning') {
    throw createError({ statusCode: 400, message: 'action must be "check" or "cleaning".' })
  }

  const code = recordCode.trim().toUpperCase()

  // Find the most recent service entry for this record
  const entries = await pgrestAdmin<any[]>('/service_entries', {
    query: {
      record_code: `eq.${code}`,
      select: 'id',
      order:  'id.desc',
      limit:  '1'
    }
  })

  if (!entries?.length) {
    throw createError({ statusCode: 404, message: 'No service entry found for this record code.' })
  }

  const entryId = entries[0].id

  // Timestamp in Africa/Johannesburg (stored as UTC, formatted on read)
  const nowUtc = new Date().toISOString()

  const patch = action === 'check'
    ? { check_completed_at: nowUtc }
    : { cleaning_completed_at: nowUtc }

  await pgrestAdmin(`/service_entries?id=eq.${entryId}`, {
    method: 'PATCH',
    extraHeaders: { Prefer: 'return=minimal' },
    body: patch
  })

  // Return the formatted Johannesburg time for immediate UI display
  const formatted = new Date(nowUtc).toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  return { ok: true, entryId, timestamp: formatted }
})
