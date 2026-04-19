export interface Record {
  id: number
  code: string
  name: string
  description: string
  type: string
  location: string
  ownerUserId: number | null
  ownerCompanyId: number | null
  createdAt: string
}

export const useRecords = () => {
  const { authToken } = useAuth()
  const records = useState<Record[]>('records', () => [])
  const recordsLoading = useState<boolean>('records-loading', () => false)

  const authHeaders = computed(() =>
    authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}
  )

  const loadRecords = async () => {
    recordsLoading.value = true
    try {
      records.value = await $fetch<Record[]>('/api/records', { headers: authHeaders.value })
    } catch {
      records.value = []
    } finally {
      recordsLoading.value = false
    }
  }

  const getRecords = () => records.value

  const getRecordById = (id: number) => records.value.find(r => r.id === id) ?? null

  const getRecordByCode = (code: string) => {
    const normalized = code.trim().toUpperCase()
    return records.value.find(r => r.code.toUpperCase() === normalized) ?? null
  }

  const fetchRecordByCode = async (code: string): Promise<Record | null> => {
    try {
      return await $fetch<Record>(`/api/records/${code.trim().toUpperCase()}`, {
        headers: authHeaders.value
      })
    } catch {
      return null
    }
  }

  const getRecordsByOwner = (ownerUserId: number) =>
    records.value.filter(r => r.ownerUserId === ownerUserId)

  const getRecordsByCompany = (ownerCompanyId: number) =>
    records.value.filter(r => r.ownerCompanyId === ownerCompanyId)

  const addRecord = async (input: {
    name: string
    description?: string
    type?: string
    location?: string
    ownerUserId?: number | null
    ownerCompanyId?: number | null
  }): Promise<Record> => {
    const created = await $fetch<Record>('/api/records', {
      method: 'POST',
      headers: authHeaders.value,
      body: input
    })
    records.value = [created, ...records.value]
    return created
  }

  const updateRecord = async (
    id: number,
    input: {
      name?: string
      description?: string
      type?: string
      location?: string
      ownerUserId?: number | null
      ownerCompanyId?: number | null
    }
  ): Promise<void> => {
    if (!id || !Number.isFinite(id)) throw new Error(`updateRecord called with invalid id: ${id}`)
    await $fetch(`/api/records/${id}`, {
      method: 'PATCH' as 'POST',
      headers: authHeaders.value,
      body: input
    })
    records.value = records.value.map(r =>
      r.id !== id ? r : {
        ...r,
        name:          input.name          ?? r.name,
        description:   input.description   ?? r.description,
        type:          input.type          ?? r.type,
        location:      input.location      ?? r.location,
        ownerUserId:   'ownerUserId'   in input ? input.ownerUserId   ?? null : r.ownerUserId,
        ownerCompanyId:'ownerCompanyId' in input ? input.ownerCompanyId ?? null : r.ownerCompanyId
      }
    )
  }

  const deleteRecord = async (id: number): Promise<void> => {
    if (!id || !Number.isFinite(id)) throw new Error(`deleteRecord called with invalid id: ${id}`)
    await $fetch(`/api/records/${id}`, {
      method: 'DELETE' as 'POST',
      headers: authHeaders.value
    })
    records.value = records.value.filter(r => r.id !== id)
  }

  return {
    records,
    recordsLoading,
    loadRecords,
    getRecords,
    getRecordById,
    getRecordByCode,
    fetchRecordByCode,
    getRecordsByOwner,
    getRecordsByCompany,
    addRecord,
    updateRecord,
    deleteRecord
  }
}
