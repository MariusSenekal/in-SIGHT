export type ScheduleStatus = 'Done' | 'Incomplete' | 'Not Done'

export interface ServiceTask {
  id: string
  task: string
  completed: boolean
}

export interface ServiceMessage {
  id: number
  fromRole: 'admin' | 'staff' | 'site-user'
  fromName: string
  text: string
  createdAt: string
}

export interface ServiceEntry {
  id: number
  recordCode: string
  startTime: string
  endTime: string
  status: ScheduleStatus
  notes: string
  checklist: ServiceTask[]
  messages: ServiceMessage[]
}

export interface ChecklistTemplate {
  recordCode: string
  tasks: string[]
  updatedAt: string
  updatedBy: string
}

interface PersistedScheduleState {
  templates: ChecklistTemplate[]
  entries: ServiceEntry[]
}

const STORAGE_KEY = 'insight-schedule-tracking-v1'

const defaultTemplateTasks = [
  'Cleaning check completed',
  'Cleaning completed'
]

const toClock = (iso: string) => {
  return new Date(iso).toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const normalizeStatus = (checklist: ServiceTask[]): ScheduleStatus => {
  if (checklist.length === 0) {
    return 'Not Done'
  }

  const completedCount = checklist.filter(task => task.completed).length

  if (completedCount === 0) {
    return 'Not Done'
  }

  if (completedCount === checklist.length) {
    return 'Done'
  }

  return 'Incomplete'
}

const isChecklistComplete = (checklist: ServiceTask[]) => {
  return checklist.length > 0 && checklist.every(task => task.completed)
}

const makeChecklist = (tasks: string[]): ServiceTask[] => {
  return tasks.map((task, index) => ({
    id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2, 8)}`,
    task,
    completed: false
  }))
}

const createDefaultEntriesForRecord = (recordCode: string, tasks: string[]): ServiceEntry[] => {
  const now = Date.now()
  const entryOneStart = new Date(now - 24 * 60 * 60 * 1000)
  const entryOneEnd = new Date(now - 24 * 60 * 60 * 1000 + 45 * 60 * 1000)
  const entryTwoStart = new Date(now - 2 * 24 * 60 * 60 * 1000)
  const entryTwoEnd = new Date(now - 2 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000)

  const firstChecklist = makeChecklist(tasks).map((item, index) => {
    return {
      ...item,
      completed: index < Math.max(tasks.length - 1, 1)
    }
  })

  const secondChecklist = makeChecklist(tasks)

  return [
    {
      id: now,
      recordCode,
      startTime: toClock(entryOneStart.toISOString()),
      endTime: toClock(entryOneEnd.toISOString()),
      status: normalizeStatus(firstChecklist),
      notes: 'Routine service completed. One final item is pending confirmation.',
      checklist: firstChecklist,
      messages: []
    },
    {
      id: now - 1,
      recordCode,
      startTime: toClock(entryTwoStart.toISOString()),
      endTime: toClock(entryTwoEnd.toISOString()),
      status: normalizeStatus(secondChecklist),
      notes: 'Scheduled tracking generated and waiting for staff completion.',
      checklist: secondChecklist,
      messages: []
    }
  ]
}

export const useScheduleTracking = () => {
  const templates = useState<ChecklistTemplate[]>('schedule-templates', () => [])
  const entries = useState<ServiceEntry[]>('schedule-entries', () => [])
  const hydrated = useState<boolean>('schedule-hydrated', () => false)

  const persist = () => {
    if (!import.meta.client) {
      return
    }

    const payload: PersistedScheduleState = {
      templates: templates.value,
      entries: entries.value
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  const hydrate = () => {
    if (!import.meta.client || hydrated.value) {
      return
    }

    const raw = localStorage.getItem(STORAGE_KEY)

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as PersistedScheduleState
        templates.value = Array.isArray(parsed.templates) ? parsed.templates : []
        entries.value = Array.isArray(parsed.entries) ? parsed.entries : []
      } catch {
        templates.value = []
        entries.value = []
      }
    }

    hydrated.value = true
  }

  const getChecklistTemplate = (recordCode: string) => {
    hydrate()
    const normalizedCode = recordCode.trim().toUpperCase()

    const existing = templates.value.find(item => item.recordCode.toUpperCase() === normalizedCode)

    if (existing) {
      return existing
    }

    const created: ChecklistTemplate = {
      recordCode: normalizedCode,
      tasks: [...defaultTemplateTasks],
      updatedAt: new Date().toISOString(),
      updatedBy: 'System'
    }

    templates.value = [...templates.value, created]
    persist()

    return created
  }

  const setChecklistTemplate = (recordCode: string, tasks: string[], updatedBy: string) => {
    hydrate()

    const normalizedCode = recordCode.trim().toUpperCase()
    const cleanedTasks = tasks
      .map(task => task.trim())
      .filter(task => Boolean(task))

    const template: ChecklistTemplate = {
      recordCode: normalizedCode,
      tasks: cleanedTasks.length > 0 ? cleanedTasks : [...defaultTemplateTasks],
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy.trim() || 'Admin'
    }

    const exists = templates.value.some(item => item.recordCode.toUpperCase() === normalizedCode)

    templates.value = exists
      ? templates.value.map(item => item.recordCode.toUpperCase() === normalizedCode ? template : item)
      : [template, ...templates.value]

    persist()

    return template
  }

  const getEntriesByRecordCode = (recordCode: string) => {
    hydrate()

    const normalizedCode = recordCode.trim().toUpperCase()
    const existing = entries.value.filter(item => item.recordCode.toUpperCase() === normalizedCode)

    if (existing.length > 0) {
      return [...existing].sort((a, b) => b.id - a.id)
    }

    const template = getChecklistTemplate(normalizedCode)
    const seeded = createDefaultEntriesForRecord(normalizedCode, template.tasks)

    entries.value = [...seeded, ...entries.value]
    persist()

    return seeded
  }

  const getAllEntries = () => {
    hydrate()

    return [...entries.value].sort((a, b) => b.id - a.id)
  }

  const toggleTask = (entryId: number, taskId: string, completed: boolean) => {
    hydrate()

    entries.value = entries.value.map(entry => {
      if (entry.id !== entryId) {
        return entry
      }

      const wasComplete = isChecklistComplete(entry.checklist)

      const updatedChecklist = entry.checklist.map(task => {
        if (task.id !== taskId) {
          return task
        }

        return {
          ...task,
          completed
        }
      })

      const nowComplete = isChecklistComplete(updatedChecklist)
      let nextEndTime = entry.endTime

      if (!wasComplete && nowComplete) {
        nextEndTime = toClock(new Date().toISOString())
      }

      if (wasComplete && !nowComplete) {
        nextEndTime = 'Pending completion'
      }

      return {
        ...entry,
        checklist: updatedChecklist,
        status: normalizeStatus(updatedChecklist),
        endTime: nextEndTime
      }
    })

    persist()
  }

  const addMessage = (entryId: number, fromRole: ServiceMessage['fromRole'], fromName: string, text: string) => {
    hydrate()

    const cleanText = text.trim()

    if (!cleanText) {
      return
    }

    let nextMessageId = 1

    entries.value = entries.value.map(entry => {
      if (entry.id !== entryId) {
        return entry
      }

      nextMessageId = entry.messages.reduce((max, msg) => Math.max(max, msg.id), 0) + 1

      const message: ServiceMessage = {
        id: nextMessageId,
        fromRole,
        fromName: fromName.trim() || 'Unknown',
        text: cleanText,
        createdAt: new Date().toISOString()
      }

      return {
        ...entry,
        messages: [...entry.messages, message]
      }
    })

    persist()
  }

  return {
    getChecklistTemplate,
    setChecklistTemplate,
    getEntriesByRecordCode,
    getAllEntries,
    toggleTask,
    addMessage
  }
}
