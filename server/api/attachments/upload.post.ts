// POST /api/attachments/upload - Multipart upload of one or more files for a
// record, stored in S3 under Module/<company>/<record>/<purpose>/<file>.
import { requireAuth, pgrestAdmin } from '~/server/utils/pgrest'
import { loadOwnedRecordOrDeny } from '~/server/utils/attachmentAccess'
import { buildAttachmentKey, uploadToS3 } from '~/server/utils/s3'

const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25MB per file

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event, ['admin', 'client_admin'])

  const parts = await readMultipartFormData(event)
  if (!parts?.length) {
    throw createError({ statusCode: 400, message: 'No files received.' })
  }

  const fields: Record<string, string> = {}
  const files: Array<{ filename: string; type?: string; data: Buffer }> = []

  for (const part of parts) {
    if (part.filename) {
      files.push({ filename: part.filename, type: part.type, data: part.data })
    } else if (part.name) {
      fields[part.name] = part.data.toString('utf-8')
    }
  }

  const moduleKey = fields.module
  const recordId = Number(fields.recordId)
  const purpose = fields.purpose?.trim() || 'general'

  if (!moduleKey || !Number.isFinite(recordId)) {
    throw createError({ statusCode: 400, message: 'module and recordId are required.' })
  }
  if (!files.length) {
    throw createError({ statusCode: 400, message: 'No files received.' })
  }
  for (const file of files) {
    if (file.data.length > MAX_FILE_BYTES) {
      throw createError({ statusCode: 400, message: `${file.filename} exceeds the 25MB limit.` })
    }
  }

  const { record, companySegment, recordSegment } = await loadOwnedRecordOrDeny(
    payload, moduleKey, recordId, ['admin', 'client_admin']
  )

  const inserted: Array<Record<string, unknown>> = []
  for (const file of files) {
    const key = buildAttachmentKey({
      module: moduleKey,
      companySegment,
      recordSegment,
      purposeSegment: purpose,
      fileName: file.filename
    })
    const contentType = file.type || 'application/octet-stream'
    await uploadToS3(key, file.data, contentType)

    const rows = await pgrestAdmin<Array<Record<string, unknown>>>('/attachments', {
      method: 'POST',
      query: { select: 'id,file_name,content_type,size_bytes,purpose,created_at' },
      body: {
        module: moduleKey,
        record_id: recordId,
        purpose,
        file_name: file.filename,
        s3_key: key,
        content_type: contentType,
        size_bytes: file.data.length,
        owner_user_id: record.owner_user_id,
        owner_company_id: record.owner_company_id,
        uploaded_by_user_id: Number(payload.sub)
      }
    })
    if (rows?.[0]) inserted.push(rows[0])
  }

  return { uploaded: inserted }
})
