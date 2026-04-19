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

export const useServiceRequests = () => {
  const { authToken } = useAuth()
  const requests = useState<ServiceRequest[]>('service-requests', () => [])
  const requestsLoading = useState<boolean>('service-requests-loading', () => false)

  const authHeaders = computed((): Record<string, string> =>
    authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}
  )

  const loadRequests = async () => {
    requestsLoading.value = true
    try {
      requests.value = await $fetch<ServiceRequest[]>('/api/requests', { headers: authHeaders.value })
    } catch {
      requests.value = []
    } finally {
      requestsLoading.value = false
    }
  }

  const getRequests = () => requests.value

  /** Add a service request — works for both authenticated users and anonymous scan submissions */
  const addRequest = async (input: {
    requestType: ServiceRequestType
    targetType: RequestTargetType
    recordCode: string | null
    siteRoom: string | null
    message: string
    requestedBy: string
    requestedByUserId: number | null
    satisfactionEmoji?: SatisfactionEmoji | null
    satisfactionEntryId?: number | null
    isAnon?: boolean
  }): Promise<ServiceRequest | null> => {
    try {
      const result = await $fetch<{ id: number; status: string; createdAt: string }>(
        '/api/scan/request',
        {
          method: 'POST',
          headers: input.isAnon ? {} : (authHeaders.value as Record<string, string>),
          body: {
            requestType: input.requestType,
            targetType: input.targetType,
            recordCode: input.recordCode,
            siteRoom: input.siteRoom,
            message: input.message,
            requestedBy: input.requestedBy,
            satisfactionEmoji: input.satisfactionEmoji ?? null
          }
        }
      )
      const newRequest: ServiceRequest = {
        id: result.id,
        requestType: input.requestType,
        targetType: input.targetType,
        recordCode: input.recordCode,
        siteRoom: input.siteRoom,
        message: input.message,
        requestedBy: input.requestedBy,
        requestedByUserId: input.requestedByUserId,
        createdAt: result.createdAt,
        status: 'open',
        satisfactionEmoji: input.satisfactionEmoji ?? null,
        satisfactionEntryId: input.satisfactionEntryId ?? null
      }
      requests.value = [newRequest, ...requests.value]
      return newRequest
    } catch {
      return null
    }
  }

  const setRequestStatus = async (id: number, status: ServiceRequest['status']) => {
    try {
      await $fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: authHeaders.value,
        body: { status }
      })
      requests.value = requests.value.map(r => r.id === id ? { ...r, status } : r)
    } catch { /* ignore */ }
  }

  const deleteRequest = async (id: number) => {
    try {
      await $fetch<void>(`/api/requests/${id}`, {
        method: 'DELETE' as 'PATCH',
        headers: authHeaders.value
      })
      requests.value = requests.value.filter(r => r.id !== id)
    } catch { /* ignore */ }
  }

  return {
    requests,
    requestsLoading,
    loadRequests,
    getRequests,
    addRequest,
    setRequestStatus,
    deleteRequest
  }
}
