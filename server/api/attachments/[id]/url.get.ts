// GET /api/attachments/[id]/url - Short-lived signed URL to view/download a file.
import { requireAuth, pgrestAdmin } from '~/server/utils/pgrest'
import { loadOwnedRecordOrDeny } from '~/server/utils/attachmentAccess'
import { getSignedViewUrl } from '~/server/utils/s3'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, message: 'Invalid attachment id.' })
  }

  const rows = await pgrestAdmin<Array<Record<string, unknown>>>('/attachments', {
    query: { id: `eq.${id}`, select: 'id,module,record_id,s3_key,file_name' }
  })
  const attachment = rows?.[0]
  if (!attachment) {
    throw createError({ statusCode: 404, message: 'Attachment not found.' })
  }

  await loadOwnedRecordOrDeny(
    payload, String(attachment.module), Number(attachment.record_id),
    ['admin', 'staff', 'client_admin', 'client_technician']
  )

  const url = await getSignedViewUrl(String(attachment.s3_key), String(attachment.file_name))
  return { url }
})
