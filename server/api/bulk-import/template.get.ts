// GET /api/bulk-import/template?module=clients - Downloadable CSV template
// for a given module. Admin-only.
import { requireAuth } from '~/server/utils/pgrest'
import { bulkImportSchemas } from '~/server/utils/bulkImportSchemas'
import { toCsv } from '~/server/utils/csv'

export default defineEventHandler((event) => {
  requireAuth(event, ['admin'])

  const moduleKey = getQuery(event).module as string
  const schema = bulkImportSchemas[moduleKey]
  if (!schema) {
    throw createError({ statusCode: 400, message: 'Unknown module.' })
  }

  // Header row only — no example row, so every line a user adds below it is
  // unambiguously a real record to import (nothing to remember to delete).
  const headerRow = schema.fields.map((f) => f.header)
  const csv = toCsv([headerRow])

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${moduleKey}-template.csv"`)
  return csv
})
