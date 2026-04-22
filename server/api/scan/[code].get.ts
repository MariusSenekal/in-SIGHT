// GET /api/scan/[code]
// PUBLIC endpoint — no auth required. Returns record + service history for QR scan page.
import { pgrestAdmin } from '../../utils/pgrest'

const formatTime = (iso: string | null): string => {
  if (!iso) return 'Pending completion'
  return new Date(iso).toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const formatTimeOrNull = (iso: string | null): string | null => {
  if (!iso) return null
  return new Date(iso).toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')!.trim().toUpperCase()

  // Fetch record (admin JWT bypasses RLS — anon has no direct table access)
  const records = await pgrestAdmin<any[]>('/records', {
    query: { code: `eq.${code}` }
  })

  if (!records?.length) throw createError({ statusCode: 404, message: 'Record not found.' })
  const r = records[0]

  // Fetch service entries with embedded tasks and messages
  const entries = await pgrestAdmin<any[]>('/service_entries', {
    query: {
      record_code: `eq.${code}`,
      select: '*,service_tasks(id,task,completed,sort_order),service_messages(id,from_role,from_name,text,created_at)',
      order: 'id.desc'
    }
  })

  return {
    record: {
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description ?? '',
      type: r.type ?? '',
      location: r.location ?? ''
    },
    entries: (entries ?? []).map((e: any) => ({
      id: e.id,
      recordCode: e.record_code,
      startTime: formatTime(e.start_time),
      endTime: formatTime(e.end_time),
      status: e.status,
      notes: e.notes ?? '',
      checkCompletedAt: formatTimeOrNull(e.check_completed_at),
      cleaningCompletedAt: formatTimeOrNull(e.cleaning_completed_at),
      checklist: (e.service_tasks ?? [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((t: any) => ({ id: t.id, task: t.task, completed: t.completed })),
      messages: (e.service_messages ?? []).map((m: any) => ({
        id: m.id,
        fromRole: m.from_role,
        fromName: m.from_name,
        text: m.text,
        createdAt: m.created_at
      }))
    }))
  }
})
