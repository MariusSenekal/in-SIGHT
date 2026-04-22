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
  requireAuth(event, ['admin', 'staff', 'cleaner'])
  const token = getBearerToken(event)!
  const code = getQuery(event).recordCode as string | undefined

  const query: Record<string, string> = {
    select: '*,service_tasks(id,task,completed,sort_order),service_messages(id,from_role,from_name,text,created_at)',
    order: 'id.desc'
  }
  if (code) query['record_code'] = `eq.${code.trim().toUpperCase()}`

  const rows = await pgrest<any[]>('/service_entries', { token, query })

  return (rows ?? []).map(e => ({
    id: e.id,
    recordCode: e.record_code,
    startTime: fmt(e.start_time),
    endTime: fmt(e.end_time),
    status: e.status,
    notes: e.notes ?? '',
    checkCompletedAt: fmtOrNull(e.check_completed_at),
    cleaningCompletedAt: fmtOrNull(e.cleaning_completed_at),
    checklist: (e.service_tasks ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((t: any) => ({ id: t.id, task: t.task, completed: t.completed })),
    messages: (e.service_messages ?? []).map((m: any) => ({
      id: m.id, fromRole: m.from_role, fromName: m.from_name, text: m.text, createdAt: m.created_at
    }))
  }))
})
