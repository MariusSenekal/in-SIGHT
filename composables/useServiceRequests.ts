export type ServiceRequestType = 'maintenance' | 'cleaning' | 'satisfaction'
export type RequestTargetType = 'qr' | 'site-room'
export type SatisfactionEmoji = 'happy' | 'sad'

export interface ServiceRequest {
  id: number
  requestType: ServiceRequestType
  targetType: RequestTargetType
  recordCode: string | null
  siteRoom: string | null
  message: string
  requestedBy: string
  requestedByUserId: number | null
  createdAt: string
  status: 'open' | 'resolved'
  satisfactionEmoji: SatisfactionEmoji | null
  satisfactionEntryId: number | null
}

interface NewServiceRequestInput {
  requestType: ServiceRequestType
  targetType: RequestTargetType
  recordCode: string | null
  siteRoom: string | null
  message: string
  requestedBy: string
  requestedByUserId: number | null
  satisfactionEmoji?: SatisfactionEmoji | null
  satisfactionEntryId?: number | null
}

export const useServiceRequests = () => {
  const storageKey = 'insight-service-requests-v1'
  const requests = useState<ServiceRequest[]>('service-requests', () => [])
  const hydrated = useState<boolean>('service-requests-hydrated', () => false)

  const persist = () => {
    if (!import.meta.client) {
      return
    }

    localStorage.setItem(storageKey, JSON.stringify(requests.value))
  }

  const hydrate = () => {
    if (!import.meta.client || hydrated.value) {
      return
    }

    const raw = localStorage.getItem(storageKey)

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ServiceRequest[]
        requests.value = Array.isArray(parsed) ? parsed : []
      } catch {
        requests.value = []
      }
    }

    hydrated.value = true
  }

  const getRequests = () => {
    hydrate()
    return [...requests.value].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }

  const addRequest = (input: NewServiceRequestInput) => {
    hydrate()

    const nextId = requests.value.reduce((max, item) => Math.max(max, item.id), 0) + 1

    const request: ServiceRequest = {
      id: nextId,
      requestType: input.requestType,
      targetType: input.targetType,
      recordCode: input.recordCode,
      siteRoom: input.siteRoom,
      message: input.message,
      requestedBy: input.requestedBy,
      requestedByUserId: input.requestedByUserId,
      createdAt: new Date().toISOString(),
      status: 'open',
      satisfactionEmoji: input.satisfactionEmoji ?? null,
      satisfactionEntryId: input.satisfactionEntryId ?? null
    }

    requests.value = [request, ...requests.value]
    persist()

    return request
  }

  const setRequestStatus = (id: number, status: ServiceRequest['status']) => {
    hydrate()
    requests.value = requests.value.map(item => {
      if (item.id !== id) {
        return item
      }

      return {
        ...item,
        status
      }
    })

    persist()
  }

  return {
    getRequests,
    addRequest,
    setRequestStatus
  }
}
