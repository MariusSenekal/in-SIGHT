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

  // Check if this is a vehicle or equipment code
  if (code.startsWith('VH-')) {
    // Vehicle code - fetch and return vehicle data
    const vehicles = await pgrestAdmin<any[]>('/vehicles', {
      query: { code: `eq.${code}` }
    })
    if (!vehicles?.length) throw createError({ statusCode: 404, message: 'Vehicle not found.' })
    const vehicle = vehicles[0]
    return {
      type: 'vehicle',
      id: vehicle.id,
      code: vehicle.code,
      name: `${vehicle.make} ${vehicle.model}`,
      description: `${vehicle.year} • ${vehicle.registration_number}`,
      location: vehicle.location || 'No location specified'
    }
  }

  if (code.startsWith('EQ-')) {
    // Equipment code - fetch and return equipment data
    const equipment = await pgrestAdmin<any[]>('/equipment', {
      query: { code: `eq.${code}` }
    })
    if (!equipment?.length) throw createError({ statusCode: 404, message: 'Equipment not found.' })
    const item = equipment[0]
    return {
      type: 'equipment',
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.category || 'Equipment',
      location: item.location || 'No location specified'
    }
  }

  // Default: Handle as a record (original behavior)
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

  // Fetch completion history for all entries
  const entryIds = (entries ?? []).map((e: any) => e.id)
  let completionHistory: any[] = []
  if (entryIds.length > 0) {
    completionHistory = await pgrestAdmin<any[]>('/service_entry_completion_history', {
      query: {
        service_entry_id: `in.(${entryIds.join(',')})`,
        select: '*',
        order: 'completed_at.desc'
      }
    }) ?? []
  }

  return {
    record: {
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description ?? '',
      type: r.type ?? '',
      location: r.location ?? ''
    },
    entries: (entries ?? []).map((e: any) => {
      const history = completionHistory.filter((h: any) => h.service_entry_id === e.id)
      return {
        id: e.id,
        recordCode: e.record_code,
        startTime: formatTime(e.start_time),
        endTime: formatTime(e.end_time),
        status: e.status,
        notes: e.notes ?? '',
        createdByRole: e.created_by_role || null,
        checkCompletedAt: formatTimeOrNull(e.check_completed_at),
        cleaningCompletedAt: formatTimeOrNull(e.cleaning_completed_at),
        uvCheckCompletedAt: formatTimeOrNull(e.uv_check_completed_at),
        jobStartedAt: formatTimeOrNull(e.job_started_at),
        jobCompletedAt: formatTimeOrNull(e.job_completed_at),
        latitude: e.latitude || null,
        longitude: e.longitude || null,
        checklist: (e.service_tasks ?? [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((t: any) => ({ id: t.id, task: t.task, completed: t.completed })),
        messages: (e.service_messages ?? []).map((m: any) => ({
          id: m.id,
          fromRole: m.from_role,
          fromName: m.from_name,
          text: m.text,
          createdAt: m.created_at
        })),
        completionHistory: history.map((h: any) => ({
          id: h.id,
          actionType: h.action_type,
          completedAt: formatTimeOrNull(h.completed_at),
          completedBy: h.completed_by
        }))
      }
    })
  }
})
