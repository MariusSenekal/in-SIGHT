import { bulkImportSchemas, type BulkFieldSpec } from './bulkImportSchemas'

export interface RowError {
  row: number
  message: string
}

export interface PreviewRow {
  /** 1-based row number as shown to the admin (accounts for header + sample row). */
  row: number
  values: Record<string, string>
  /** Per-field error messages, keyed by field.key, for this row only. */
  fieldErrors: Record<string, string>
}

export interface ValidatedImport {
  headersMatch: boolean
  records: Array<Record<string, unknown>>
  /** Every row (valid or not) so the admin can see, edit, and fix/delete any of them. */
  previewRows: PreviewRow[]
  errors: RowError[]
  totalRows: number
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const coerceValue = (field: BulkFieldSpec, raw: string): { value: unknown; error?: string } => {
  const trimmed = raw.trim()

  if (!trimmed) {
    if (field.required) return { value: undefined, error: `${field.header} is required.` }
    // A blank optional field still needs a value in every record - PostgREST's
    // bulk insert requires every object in the array to have the same keys
    // (PGRST102 "All object keys must match" otherwise). Typed fields
    // (number/date/boolean) map to nullable columns by default, so null is
    // correct and safe there; plain text fields map to NOT NULL DEFAULT ''
    // columns, so they get '' instead. `blankValue` overrides both for the
    // rare NOT NULL typed column with a non-null default.
    if (field.blankValue !== undefined) return { value: field.blankValue }
    return { value: field.type ? null : '' }
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

// The xlsx template ships a greyed-out example row (row 2) so admins can see
// the expected format without a separate instructions row. If the first
// data row still matches the schema's example values verbatim, the admin
// never touched/replaced it - treat it as template filler, not a real record.
const isSampleRow = (row: string[], fields: BulkFieldSpec[]): boolean =>
  fields.every((f, i) => (row[i] ?? '').trim() === f.example.trim())

/**
 * Validates row-objects (key -> raw string, same shape the preview table
 * shows and the admin edits in the browser) against a module's schema.
 * Used directly by the upload endpoint once the admin has edited the
 * preview, and internally by validateImport() for the file-upload path.
 */
export const validateRows = (
  moduleKey: string,
  rows: Array<Record<string, string>>,
  ownerIds: { userId: number; companyId: number | null },
  rowNumberOffset = 2
): Omit<ValidatedImport, 'headersMatch'> => {
  const schema = bulkImportSchemas[moduleKey]
  const errors: RowError[] = []
  const records: Array<Record<string, unknown>> = []
  const previewRows: PreviewRow[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + rowNumberOffset
    const record: Record<string, unknown> = {
      owner_user_id: ownerIds.userId,
      owner_company_id: ownerIds.companyId
    }
    const values: Record<string, string> = {}
    const fieldErrors: Record<string, string> = {}
    let rowHasError = false

    schema.fields.forEach((field) => {
      const raw = row[field.key] ?? ''
      values[field.key] = raw
      const { value, error } = coerceValue(field, raw)
      if (error) {
        errors.push({ row: rowNumber, message: error })
        fieldErrors[field.key] = error
        rowHasError = true
        return
      }
      // Every record must carry the same set of keys (PostgREST's bulk
      // insert requires all array objects to match), so always set it.
      record[field.key] = value
    })

    previewRows.push({ row: rowNumber, values, fieldErrors })
    if (!rowHasError) records.push(record)
  })

  return { records, previewRows, errors, totalRows: rows.length }
}

export const validateImport = (
  moduleKey: string,
  grid: string[][],
  ownerIds: { userId: number; companyId: number | null }
): ValidatedImport => {
  const schema = bulkImportSchemas[moduleKey]

  if (grid.length === 0) {
    return { headersMatch: true, records: [], previewRows: [], errors: [], totalRows: 0 }
  }

  const headerRow = grid[0].map((h) => h.trim())
  const expectedHeaders = schema.fields.map((f) => f.header)
  const headersMatch = expectedHeaders.every((h, i) => headerRow[i] === h)

  if (!headersMatch) {
    return { headersMatch: false, records: [], previewRows: [], errors: [], totalRows: 0 }
  }

  let dataRows = grid.slice(1)
  let rowNumberOffset = 2 // +1 for 0-index, +1 for the header row
  if (dataRows.length && isSampleRow(dataRows[0], schema.fields)) {
    dataRows = dataRows.slice(1)
    rowNumberOffset += 1
  }

  // Convert the raw grid into the same key -> string row-object shape
  // validateRows() works with, so both the file-upload and edited-preview
  // paths share one validation implementation.
  const rowObjects = dataRows.map((row) => {
    const obj: Record<string, string> = {}
    schema.fields.forEach((field, colIndex) => { obj[field.key] = row[colIndex] ?? '' })
    return obj
  })

  const result = validateRows(moduleKey, rowObjects, ownerIds, rowNumberOffset)
  return { headersMatch: true, ...result }
}
