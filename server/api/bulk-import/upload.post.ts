// POST /api/bulk-import/upload - Bulk INSERT new records, parsed from a CSV
// built against our own template, into one module's table, all attributed
// to a single target user/client the admin picked. This never updates
// existing rows — every row in the file becomes a brand-new record.
import { requireAuth, pgrestAdmin } from '~/server/utils/pgrest'
import { bulkImportSchemas } from '~/server/utils/bulkImportSchemas'
import { validateImport } from '~/server/utils/bulkImportValidate'

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

  const result = validateImport(body.module, body.csv, { userId: targetUserId, companyId: ownerCompanyId })

  if (!result.headersMatch) {
    throw createError({
      statusCode: 400,
      message: 'This file\'s columns don\'t match the current template. Please re-download the template and re-enter your data.'
    })
  }

  if (result.records.length === 0) {
    return { inserted: 0, errors: result.errors }
  }

  try {
    const inserted = await pgrestAdmin<unknown[]>(schema.table, {
      method: 'POST',
      body: result.records,
      query: { select: 'id' }
    })
    return { inserted: Array.isArray(inserted) ? inserted.length : result.records.length, errors: result.errors }
  } catch (error: unknown) {
    console.error('[API] Bulk import insert failed:', error)
    throw createError({ statusCode: 500, message: 'Failed to insert records. No records were imported.' })
  }
})
