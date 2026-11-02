// POST /api/bulk-import/preview - Dry-run the same parsing/validation the
// real upload uses, without writing anything, so the admin can see exactly
// what will be imported before confirming.
import { requireAuth, pgrestAdmin } from '~/server/utils/pgrest'
import { bulkImportSchemas } from '~/server/utils/bulkImportSchemas'
import { validateImport } from '~/server/utils/bulkImportValidate'

const PREVIEW_ROW_LIMIT = 20

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin'])

  const body = await readBody<{ module: string; targetUserId: number; csv: string }>(event)
  const schema = bulkImportSchemas[body?.module]
  if (!schema) {
    throw createError({ statusCode: 400, message: 'Unknown module.' })
  }

  const targetUserId = Number(body.targetUserId)
  if (!targetUserId) {
    throw createError({ statusCode: 400, message: 'A target user is required.' })
  }

  const result = validateImport(body.module, body.csv, { userId: targetUserId, companyId: null })

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
    preview: result.previewRows.slice(0, PREVIEW_ROW_LIMIT),
    fields: schema.fields.map((f) => ({ key: f.key, header: f.header }))
  }
})
