// GET /api/requests
// Returns service requests. Admin/staff see all; regular users see their own via RLS.
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin', 'staff', 'cleaner', 'uv-hero', 'user'])
  const token = getBearerToken(event)!

  const rows = await pgrest<any[]>('/service_requests', {
    token,
    query: { order: 'created_at.desc' }
  })

  return (rows ?? []).map(r => ({
    id: r.id,
    requestType: r.request_type,
    targetType: r.target_type,
    recordCode: r.record_code ?? null,
    siteRoom: r.site_room ?? null,
    message: r.message ?? '',
    requestedBy: r.requested_by,
    requestedByUserId: r.requested_by_user_id ?? null,
    createdAt: r.created_at,
    status: r.status,
    satisfactionEmoji: r.satisfaction_emoji ?? null,
    satisfactionEntryId: r.satisfaction_entry_id ?? null
  }))
})
