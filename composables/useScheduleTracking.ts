export type ScheduleStatus = 'Done' | 'Incomplete' | 'Not Done'

export interface ServiceTask {
  id: number
  task: string
  completed: boolean
  sortOrder?: number
}

export interface ServiceMessage {
  id: number
  fromRole: 'admin' | 'staff' | 'site-user'
  fromName: string
  text: string
  createdAt: string
}

export interface CompletionHistoryRecord {
  id: number
  actionType: 'check' | 'cleaning' | 'uv-check' | 'job-started' | 'job-completed'
  completedAt: string | null
  completedBy: number
}

export interface ServiceEntry {
  id: number
  recordCode: string
  startTime: string
  endTime: string
  status: ScheduleStatus
  notes: string
  createdByRole: string | null
  checkCompletedAt: string | null
  cleaningCompletedAt: string | null
  uvCheckCompletedAt?: string | null
  jobStartedAt?: string | null
  jobCompletedAt?: string | null
  latitude?: number | null
  longitude?: number | null
  checklist: ServiceTask[]
  messages: ServiceMessage[]
  completionHistory?: CompletionHistoryRecord[]
}

export interface ChecklistTemplate {
  recordCode: string
  tasks: string[]
  updatedAt: string
  updatedBy: string
}

const computeStatus = (checklist: ServiceTask[]): ScheduleStatus => {
  if (checklist.length === 0) return 'Not Done'
  const done = checklist.filter(t => t.completed).length
  if (done === 0) return 'Not Done'
  if (done === checklist.length) return 'Done'
  return 'Incomplete'
}

export const useScheduleTracking = () => {
  const { authToken } = useAuth()
  const templates = useState<ChecklistTemplate[]>('schedule-templates', () => [])
  const entries = useState<ServiceEntry[]>('schedule-entries', () => [])
  const entriesLoading = useState<boolean>('schedule-entries-loading', () => false)

  const authHeaders = computed(() =>
    authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}
  )

  /** Load entries from the server; optionally scoped to a record code */
  const loadEntries = async (recordCode?: string) => {
    entriesLoading.value = true
    try {
      const url = recordCode
        ? `/api/entries?recordCode=${encodeURIComponent(recordCode.trim().toUpperCase())}`
        : '/api/entries'
      const fetched = await $fetch<ServiceEntry[]>(url, { headers: authHeaders.value })
      if (recordCode) {
        const code = recordCode.trim().toUpperCase()
        entries.value = [...fetched, ...entries.value.filter(e => e.recordCode.toUpperCase() !== code)]
      } else {
        entries.value = fetched
      }
    } catch {
      if (!recordCode) entries.value = []
    } finally {
      entriesLoading.value = false
    }
  }

  const getEntriesByRecordCode = (recordCode: string) =>
    entries.value
      .filter(e => e.recordCode.toUpperCase() === recordCode.trim().toUpperCase())
      .sort((a, b) => b.id - a.id)

  const getAllEntries = () => [...entries.value].sort((a, b) => b.id - a.id)

  /** Fetch (and cache) a checklist template by record code */
  const getChecklistTemplate = async (recordCode: string): Promise<ChecklistTemplate> => {
    const code = recordCode.trim().toUpperCase()
    const cached = templates.value.find(t => t.recordCode.toUpperCase() === code)
    if (cached) return cached
    try {
      const template = await $fetch<ChecklistTemplate>(
        `/api/templates/${encodeURIComponent(code)}`,
        { headers: authHeaders.value }
      )
      templates.value = [...templates.value.filter(t => t.recordCode.toUpperCase() !== code), template]
      return template
    } catch {
      return {
        recordCode: code,
        tasks: ['Cleaning check completed', 'Cleaning completed'],
        updatedAt: new Date().toISOString(),
        updatedBy: 'System'
      }
    }
  }

  /** Save/update a checklist template */
  const setChecklistTemplate = async (recordCode: string, tasks: string[], updatedBy: string) => {
    const code = recordCode.trim().toUpperCase()
    const template = await $fetch<ChecklistTemplate>(
      `/api/templates/${encodeURIComponent(code)}`,
      {
        method: 'PUT',
        headers: authHeaders.value,
        body: { tasks: tasks.map(t => t.trim()).filter(Boolean), updatedBy }
      }
    )
    templates.value = [...templates.value.filter(t => t.recordCode.toUpperCase() !== code), template]
    return template
  }

  /** Toggle a task completed/uncompleted, updates reactive state optimistically */
  const toggleTask = async (entryId: number, taskId: number, completed: boolean) => {
    // Optimistic update
    entries.value = entries.value.map(entry => {
      if (entry.id !== entryId) return entry
      const updated = entry.checklist.map(t => t.id === taskId ? { ...t, completed } : t)
      return { ...entry, checklist: updated, status: computeStatus(updated) }
    })
    // Persist to server
    await $fetch(`/api/entries/${entryId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: authHeaders.value,
      body: { completed }
    })
  }

  /** Add a message to an entry; isAnon=true for unauthenticated scan-page visitors */
  const addMessage = async (
    entryId: number,
    fromRole: ServiceMessage['fromRole'],
    fromName: string,
    text: string,
    isAnon = false
  ) => {
    const message = await $fetch<ServiceMessage>(`/api/entries/${entryId}/messages`, {
      method: 'POST',
      headers: isAnon ? {} : (authHeaders.value as Record<string, string>),
      body: { fromRole, fromName: fromName.trim() || 'Unknown', text: text.trim(), isAnon }
    })
    entries.value = entries.value.map(entry =>
      entry.id !== entryId ? entry : { ...entry, messages: [...entry.messages, message] }
    )
    return message
  }

  /**
   * Record a "Check Completed", "Cleaning Completed", or UV Hero action button press for the
   * most recent service entry of a record. Returns the formatted timestamp.
   */
  const markCompletion = async (
    recordCode: string,
    action: 'check' | 'cleaning' | 'uv-check' | 'job-started' | 'job-completed',
    latitude?: number | null,
    longitude?: number | null
  ): Promise<{ entryId: number; timestamp: string; endTimeSet?: boolean }> => {
    const result = await $fetch<{ ok: boolean; entryId: number; timestamp: string; endTimeSet?: boolean }>(
      '/api/scan/complete',
      {
        method: 'POST',
        headers: authHeaders.value as Record<string, string>,
        body: { recordCode, action, latitude, longitude }
      }
    )
    // Update cached entries
    entries.value = entries.value.map(entry => {
      if (entry.id !== result.entryId) return entry
      if (action === 'check') {
        return { ...entry, checkCompletedAt: result.timestamp }
      } else if (action === 'cleaning') {
        return { ...entry, cleaningCompletedAt: result.timestamp }
      } else if (action === 'uv-check') {
        return { ...entry, uvCheckCompletedAt: result.timestamp }
      } else if (action === 'job-started') {
        return { ...entry, jobStartedAt: result.timestamp }
      } else if (action === 'job-completed') {
        return { ...entry, jobCompletedAt: result.timestamp }
      }
      return entry
    })
    return { entryId: result.entryId, timestamp: result.timestamp, endTimeSet: result.endTimeSet }
  }

  /** Remove a specific completion timestamp from an entry, recalculating its status */
  const unmarkCompletion = async (
    entryId: number,
    action: 'check' | 'cleaning' | 'uv-check' | 'job-started' | 'job-completed'
  ): Promise<void> => {
    await $fetch<{ ok: boolean; status: string }>('/api/scan/uncomplete', {
      method: 'POST',
      headers: authHeaders.value as Record<string, string>,
      body: { entryId, action }
    })
  }

  return {
    entries,
    entriesLoading,
    loadEntries,
    getEntriesByRecordCode,
    getAllEntries,
    getChecklistTemplate,
    setChecklistTemplate,
    toggleTask,
    addMessage,
    markCompletion,
    unmarkCompletion
  }
}
