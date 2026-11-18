// POST /api/bulk-import/preview - Dry-run the same parsing/validation the
// real upload uses, without writing anything, so the admin can see exactly
// what will be imported before confirming. Accepts either a freshly
// uploaded file (first preview) or a `rows` array the admin has already
// edited in the preview grid (re-validate after adding/removing/editing
// rows, before they confirm).
import { requireAuth } from '~/server/utils/pgrest'
import { bulkImportSchemas } from '~/server/utils/bulkImportSchemas'
import { validateImport, validateRows } from '~/server/utils/bulkImportValidate'
import { parseBulkImportFile, type BulkImportFilePayload } from '~/server/utils/bulkImportFile'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin'])

  const body = await readBody<
    { module: string; targetUserId: number; rows?: Array<Record<string, string>> } & Partial<BulkImportFilePayload>
  >(event)
  const schema = bulkImportSchemas[body?.module]
  if (!schema) {
    throw createError({ statusCode: 400, message: 'Unknown module.' })
  }

  const targetUserId = Number(body.targetUserId)
  if (!targetUserId) {
    throw createError({ statusCode: 400, message: 'A target user is required.' })
  }

  if (body.rows) {
    const result = validateRows(body.module, body.rows, { userId: targetUserId, companyId: null })
    return {
      totalRows: result.totalRows,
      validCount: result.records.length,
      errors: result.errors,
      preview: result.previewRows,
      fields: schema.fields
    }
  }

  if (!body.format || body.content === undefined) {
    throw createError({ statusCode: 400, message: 'A file is required.' })
  }

  let grid: string[][]
  try {
    grid = await parseBulkImportFile(body as BulkImportFilePayload)
  } catch {
    throw createError({ statusCode: 400, message: 'Could not read that file. Please re-download the template.' })
  }

  const result = validateImport(body.module, grid, { userId: targetUserId, companyId: null })

  if (!result.headersMatch) {
    throw createError({
      statusCode: 400,
      message: 'This file\'s columns don\'t match the current template. Please re-download the template and re-enter your data.'
    })
  }

  return {
    totalRows: result.totalRows,
    validCount: result.records.length,
    errors: result.errors,
    // Every row, not just a sample - the admin can edit/delete/add rows in
    // the preview grid, so it needs the full set to be a faithful editor.
    preview: result.previewRows,
    fields: schema.fields
  }
})
