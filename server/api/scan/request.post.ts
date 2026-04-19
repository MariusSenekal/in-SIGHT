// POST /api/scan/request
// PUBLIC endpoint — anonymous service request submission from scan page.
import { pgrestAdmin } from '../../../utils/pgrest'

export default defineEventHandler(async (event) => {
  const { requestType, targetType, recordCode, siteRoom, message, requestedBy, satisfactionEmoji } =
    await readBody<{
      requestType: string
      targetType: string
      recordCode: string | null
      siteRoom: string | null
      message: string
      requestedBy: string
      satisfactionEmoji?: string | null
    }>(event)

  if (!requestType || !targetType || !requestedBy?.trim()) {
    throw createError({ statusCode: 400, message: 'requestType, targetType, and requestedBy are required.' })
  }

  const rows = await pgrestAdmin<any[]>('/service_requests', {
    method: 'POST',
    body: {
      request_type: requestType,
      target_type: targetType,
      record_code: recordCode ?? null,
      site_room: siteRoom ?? null,
      message: message?.trim() ?? '',
      requested_by: requestedBy.trim(),
      requested_by_user_id: null,
      status: 'open',
      satisfaction_emoji: satisfactionEmoji ?? null
    },
    extraHeaders: { 'Prefer': 'return=representation' }
  })

  const r = rows[0]
  return { id: r.id, status: r.status, createdAt: r.created_at }
})
