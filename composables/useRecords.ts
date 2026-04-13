export interface Record {
  id: number
  code: string
  name: string
  description: string
  type: string
  location: string
}

export const useRecords = () => {
  const storageKey = 'insight-records-v1'

  const defaultRecords: Record[] = [
    {
      id: 1,
      code: 'REC-1A7C9D',
      name: 'Kitchen Cleaning Station',
      description: 'Main kitchen area cleaning equipment and supplies storage. Includes mops, cleaning solutions, and sanitizers.',
      type: 'Cleaning Station',
      location: 'Ground Floor - Kitchen'
    },
    {
      id: 2,
      code: 'REC-2B8E4F',
      name: 'Bathroom Supply Cabinet',
      description: 'Dedicated storage for bathroom cleaning materials. Contains toilet cleaners, disinfectants, and paper products.',
      type: 'Supply Cabinet',
      location: '2nd Floor - Main Bathroom'
    },
    {
      id: 3,
      code: 'REC-3C5G7H',
      name: 'Equipment Storage Room',
      description: 'Central storage for all major cleaning equipment including vacuum cleaners, floor polishers, and specialized tools.',
      type: 'Equipment Room',
      location: 'Basement - Storage Area'
    }
  ]

  const records = useState<Record[]>('records', () => [...defaultRecords])
  const recordsHydrated = useState<boolean>('records-hydrated', () => false)

  const saveRecords = () => {
    if (!import.meta.client) {
      return
    }

    localStorage.setItem(storageKey, JSON.stringify(records.value))
  }

  const ensureHydrated = () => {
    if (!import.meta.client || recordsHydrated.value) {
      return
    }

    const raw = localStorage.getItem(storageKey)

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          records.value = parsed
        }
      } catch {
        records.value = [...defaultRecords]
      }
    } else {
      records.value = [...defaultRecords]
      saveRecords()
    }

    recordsHydrated.value = true
  }

  const generateRecordCode = (): string => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

    while (true) {
      let suffix = ''

      for (let i = 0; i < 6; i += 1) {
        const index = Math.floor(Math.random() * alphabet.length)
        suffix += alphabet[index]
      }

      const code = `REC-${suffix}`
      const exists = records.value.some(record => record.code === code)

      if (!exists) {
        return code
      }
    }
  }

  const getRecords = () => {
    ensureHydrated()
    return records.value
  }

  const getRecordById = (id: number) => {
    ensureHydrated()
    return records.value.find(record => record.id === id)
  }

  const getRecordByCode = (code: string) => {
    ensureHydrated()
    const normalized = code.trim().toUpperCase()
    return records.value.find(record => record.code.toUpperCase() === normalized)
  }

  const addRecord = (input: Omit<Record, 'id' | 'code'>) => {
    ensureHydrated()

    const maxId = records.value.reduce((max, record) => Math.max(max, record.id), 0)
    const newRecord: Record = {
      id: maxId + 1,
      code: generateRecordCode(),
      name: input.name,
      description: input.description,
      type: input.type,
      location: input.location
    }

    records.value = [newRecord, ...records.value]
    saveRecords()

    return newRecord
  }

  return {
    getRecords,
    getRecordById,
    getRecordByCode,
    addRecord
  }
}
