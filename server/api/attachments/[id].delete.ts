// DELETE /api/attachments/[id] - Remove an attachment from S3 and the DB.
import { requireAuth, pgrestAdmin } from '~/server/utils/pgrest'
import { loadOwnedRecordOrDeny } from '~/server/utils/attachmentAccess'
import { deleteFromS3 } from '~/server/utils/s3'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event, ['admin', 'client_admin'])

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, message: 'Invalid attachment id.' })
  }

  const rows = await pgrestAdmin<Array<Record<string, unknown>>>('/attachments', {
    query: { id: `eq.${id}`, select: 'id,module,record_id,s3_key' }
  })
  const attachment = rows?.[0]
  if (!attachment) {
    throw createError({ statusCode: 404, message: 'Attachment not found.' })
  }

  await loadOwnedRecordOrDeny(payload, String(attachment.module), Number(attachment.record_id), ['admin', 'client_admin'])

  await deleteFromS3(String(attachment.s3_key))
  await pgrestAdmin('/attachments', { method: 'DELETE', query: { id: `eq.${id}` } })

  return { success: true }
})
