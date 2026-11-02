import { bulkImportSchemas, type BulkFieldSpec } from './bulkImportSchemas'
import { parseCsv } from './csv'

export interface RowError {
  row: number
  message: string
}

export interface ValidatedImport {
  headersMatch: boolean
  records: Array<Record<string, unknown>>
  previewRows: Array<Record<string, string>>
  errors: RowError[]
  totalRows: number
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const coerceValue = (field: BulkFieldSpec, raw: string): { value: unknown; error?: string } => {
  const trimmed = raw.trim()

  if (!trimmed) {
    if (field.required) return { value: undefined, error: `${field.header} is required.` }
    return { value: null }
  }

  if (field.type === 'number') {
    const num = Number(trimmed)
    if (!Number.isFinite(num)) return { value: undefined, error: `${field.header} must be a number.` }
    return { value: num }
  }

  if (field.type === 'date') {
    if (!DATE_RE.test(trimmed)) return { value: undefined, error: `${field.header} must be in YYYY-MM-DD format.` }
    return { value: trimmed }
  }

  if (field.type === 'boolean') {
    const lower = trimmed.toLowerCase()
    if (['true', 'yes', '1'].includes(lower)) return { value: true }
    if (['false', 'no', '0'].includes(lower)) return { value: false }
    return { value: undefined, error: `${field.header} must be TRUE or FALSE.` }
  }

  return { value: trimmed }
}

export const validateImport = (
  moduleKey: string,
  csv: string,
  ownerIds: { userId: number; companyId: number | null }
): ValidatedImport => {
  const schema = bulkImportSchemas[moduleKey]
  const grid = parseCsv(csv ?? '')

  if (grid.length === 0) {
    return { headersMatch: true, records: [], previewRows: [], errors: [], totalRows: 0 }
  }

  const headerRow = grid[0].map((h) => h.trim())
  const expectedHeaders = schema.fields.map((f) => f.header)
  const headersMatch = expectedHeaders.every((h, i) => headerRow[i] === h)

  if (!headersMatch) {
    return { headersMatch: false, records: [], previewRows: [], errors: [], totalRows: 0 }
  }

  const dataRows = grid.slice(1)
  const errors: RowError[] = []
  const records: Array<Record<string, unknown>> = []
  const previewRows: Array<Record<string, string>> = []

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2 // +1 for 0-index, +1 for the header row
    const record: Record<string, unknown> = {
      owner_user_id: ownerIds.userId,
      owner_company_id: ownerIds.companyId
    }
    const preview: Record<string, string> = {}
    let rowHasError = false

    schema.fields.forEach((field, colIndex) => {
      const raw = row[colIndex] ?? ''
      preview[field.key] = raw
      const { value, error } = coerceValue(field, raw)
      if (error) {
        errors.push({ row: rowNumber, message: error })
        rowHasError = true
        return
      }
      record[field.key] = value
    })

    if (!rowHasError) {
      records.push(record)
      previewRows.push(preview)
    }
  })

  return { headersMatch: true, records, previewRows, errors, totalRows: dataRows.length }
}
