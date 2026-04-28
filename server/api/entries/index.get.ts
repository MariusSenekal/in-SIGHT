// GET /api/entries
// Returns all service entries with embedded tasks and messages. Admin/staff.
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-ZA', {
        timeZone: 'Africa/Johannesburg',
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    : 'Pending completion'

const fmtOrNull = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-ZA', {
        timeZone: 'Africa/Johannesburg',
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    : null

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin', 'staff', 'cleaner', 'uv-hero'])
  const token = getBearerToken(event)!
  const code = getQuery(event).recordCode as string | undefined

  const query: Record<string, string> = {
    select: '*,service_tasks(id,task,completed,sort_order),service_messages(id,from_role,from_name,text,created_at)',
    order: 'id.desc'
  }
  if (code) query['record_code'] = `eq.${code.trim().toUpperCase()}`

  const rows = await pgrest<any[]>('/service_entries', { token, query })

  // Fetch completion history for all entries
  const entryIds = (rows ?? []).map((e: any) => e.id)
  let completionHistory: any[] = []
  if (entryIds.length > 0) {
    completionHistory = await pgrest<any[]>('/service_entry_completion_history', {
      token,
      query: {
        service_entry_id: `in.(${entryIds.join(',')})`,
        select: '*',
        order: 'completed_at.desc'
      }
    }) ?? []
  }

  return (rows ?? []).map(e => {
    const history = completionHistory.filter((h: any) => h.service_entry_id === e.id)
    return {
      id: e.id,
      recordCode: e.record_code,
      startTime: fmt(e.start_time),
      endTime: fmt(e.end_time),
      status: e.status,
      notes: e.notes ?? '',
      createdByRole: e.created_by_role || null,
      checkCompletedAt: fmtOrNull(e.check_completed_at),
      cleaningCompletedAt: fmtOrNull(e.cleaning_completed_at),
      uvCheckCompletedAt: fmtOrNull(e.uv_check_completed_at),
      jobStartedAt: fmtOrNull(e.job_started_at),
      jobCompletedAt: fmtOrNull(e.job_completed_at),
      latitude: e.latitude || null,
      longitude: e.longitude || null,
      checklist: (e.service_tasks ?? [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((t: any) => ({ id: t.id, task: t.task, completed: t.completed })),
      messages: (e.service_messages ?? []).map((m: any) => ({
        id: m.id, fromRole: m.from_role, fromName: m.from_name, text: m.text, createdAt: m.created_at
      })),
      completionHistory: history.map((h: any) => ({
        id: h.id,
        actionType: h.action_type,
        completedAt: fmtOrNull(h.completed_at),
        completedBy: h.completed_by
      }))
    }
  })
})
