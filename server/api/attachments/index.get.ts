// GET /api/attachments?module=hr&recordId=5 - List attachments for a record.
import { requireAuth, pgrestAdmin } from '~/server/utils/pgrest'
import { loadOwnedRecordOrDeny } from '~/server/utils/attachmentAccess'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)

  const query = getQuery(event)
  const moduleKey = String(query.module ?? '')
  const recordId = Number(query.recordId)
  if (!moduleKey || !Number.isFinite(recordId)) {
    throw createError({ statusCode: 400, message: 'module and recordId are required.' })
  }

  await loadOwnedRecordOrDeny(payload, moduleKey, recordId, ['admin', 'staff', 'client_admin', 'client_technician'])

  const attachments = await pgrestAdmin<Array<Record<string, unknown>>>('/attachments', {
    query: {
      module: `eq.${moduleKey}`,
      record_id: `eq.${recordId}`,
      select: 'id,file_name,content_type,size_bytes,purpose,created_at',
      order: 'created_at.desc'
    }
  })

  return attachments ?? []
})
