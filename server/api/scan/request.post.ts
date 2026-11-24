// POST /api/scan/request
// PUBLIC endpoint — anonymous service request submission from scan page.
import { pgrestAdmin } from '../../utils/pgrest'
import { getIO } from '../../utils/socket'
import { sendPushToUser } from '../../utils/push'
import { createNotification } from '../../utils/notifications'

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

  // Broadcast to all admin/staff clients watching the requests page.
  const io = getIO()
  if (io) {
    io.to('admins').emit('new-service-request', {
      id: r.id,
      requestType,
      targetType,
      recordCode: recordCode ?? null,
      siteRoom: siteRoom ?? null,
      message: message?.trim() ?? '',
      requestedBy: requestedBy.trim(),
      requestedByUserId: null,
      status: 'open',
      createdAt: r.created_at,
      satisfactionEmoji: satisfactionEmoji ?? null,
      satisfactionEntryId: null
    })
  }

  // Notify every system admin (role = 'admin', never a client_admin) with a
  // push notification and an in-app notification row, same as birthday and
  // client-date reminders. Every admin needs to see every incoming request,
  // not just whoever happens to be watching the requests page live.
  const admins = await pgrestAdmin<Array<{ id: number }>>('/users', {
    query: { role: 'eq.admin', is_active: 'eq.true', select: 'id' }
  })

  if (admins?.length) {
    const title = `🧹 New ${requestType} request`
    const location = siteRoom?.trim() || recordCode?.trim() || 'a record'
    const body = `${requestedBy.trim()} requested ${requestType} for ${location}.`

    await Promise.all(admins.map((admin) => Promise.all([
      sendPushToUser(admin.id, {
        title,
        body,
        tag: `service-request-${r.id}`,
        url: '/dashboard/requests'
      }),
      createNotification({
        userId: admin.id,
        type: 'service_request',
        title,
        body,
        linkType: 'requests',
        linkId: r.id,
        dedupeKey: `service-request-${r.id}-${admin.id}`
      })
    ])))
  }

  return { id: r.id, status: r.status, createdAt: r.created_at }
})
