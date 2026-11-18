// POST /api/bulk-import/upload - Bulk INSERT new records, built from the
// row data the admin reviewed (and optionally edited/added/deleted) in the
// preview grid, into one module's table, all attributed to a single target
// user/client the admin picked. This never updates existing rows — every
// row becomes a brand-new record.
import { requireAuth, pgrestAdmin } from '~/server/utils/pgrest'
import { bulkImportSchemas } from '~/server/utils/bulkImportSchemas'
import { validateRows } from '~/server/utils/bulkImportValidate'
import { generateUniqueRecordCodes } from '~/server/utils/recordCode'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin'])

  const body = await readBody<{ module: string; targetUserId: number; rows: Array<Record<string, string>> }>(event)
  const schema = bulkImportSchemas[body?.module]
  if (!schema) {
    throw createError({ statusCode: 400, message: 'Unknown module.' })
  }

  const targetUserId = Number(body.targetUserId)
  if (!targetUserId) {
    throw createError({ statusCode: 400, message: 'A target user is required.' })
  }

  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    throw createError({ statusCode: 400, message: 'No rows to import.' })
  }

  const targetUsers = await pgrestAdmin<Array<{ id: number }>>('/users', {
    query: { id: `eq.${targetUserId}`, select: 'id' }
  })
  if (!targetUsers?.length) {
    throw createError({ statusCode: 404, message: 'Target user not found.' })
  }

  const memberships = await pgrestAdmin<Array<{ company_id: number }>>('/company_users', {
    query: { user_id: `eq.${targetUserId}`, select: 'company_id' }
  })
  const ownerCompanyId = memberships?.length ? Number(memberships[0].company_id) : null

  const result = validateRows(body.module, body.rows, { userId: targetUserId, companyId: ownerCompanyId })

  if (result.records.length === 0) {
    return { inserted: 0, errors: result.errors }
  }

  // QR records need a unique `code`, same as the single-record create
  // endpoint - the generic bulk-import schema/validator has no notion of
  // this, so it's stamped on here, specifically for this one module.
  if (body.module === 'records') {
    const codes = await generateUniqueRecordCodes(result.records.length)
    result.records.forEach((record, i) => { record.code = codes[i] })
  }

  try {
    const inserted = await pgrestAdmin<unknown[]>(schema.table, {
      method: 'POST',
      body: result.records,
      query: { select: 'id' }
    })
    return { inserted: Array.isArray(inserted) ? inserted.length : result.records.length, errors: result.errors }
  } catch (error: any) {
    console.error('[API] Bulk import insert failed:', error?.data ?? error)
    const pgMessage = error?.data?.message || error?.data?.hint
    throw createError({
      statusCode: 500,
      message: pgMessage
        ? `Failed to insert records: ${pgMessage}`
        : 'Failed to insert records. No records were imported.'
    })
  }
})
