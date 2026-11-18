// GET /api/bulk-import/template?module=clients&format=xlsx|csv
// Downloadable template for a given module - a styled .xlsx by default, or
// a plain CSV if requested. Admin-only.
import { requireAuth } from '~/server/utils/pgrest'
import { bulkImportSchemas } from '~/server/utils/bulkImportSchemas'
import { toCsv } from '~/server/utils/csv'
import { buildXlsxTemplate } from '~/server/utils/xlsx'

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin'])

  const query = getQuery(event)
  const moduleKey = query.module as string
  const format = query.format === 'csv' ? 'csv' : 'xlsx'
  const schema = bulkImportSchemas[moduleKey]
  if (!schema) {
    throw createError({ statusCode: 400, message: 'Unknown module.' })
  }

  if (format === 'csv') {
    // Header row only — no example row, so every line a user adds below it is
    // unambiguously a real record to import (nothing to remember to delete).
    const headerRow = schema.fields.map((f) => f.header)
    const csv = toCsv([headerRow])

    setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
    setHeader(event, 'Content-Disposition', `attachment; filename="${moduleKey}-template.csv"`)
    return csv
  }

  const buffer = await buildXlsxTemplate(schema.fields, schema.label)
  setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setHeader(event, 'Content-Disposition', `attachment; filename="${moduleKey}-template.xlsx"`)
  return buffer
})
