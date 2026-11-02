import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

let cachedClient: S3Client | null = null

const getClient = (): S3Client => {
  if (cachedClient) return cachedClient
  const config = useRuntimeConfig()
  cachedClient = new S3Client({
    region: config.awsRegion as string,
    credentials: {
      accessKeyId: config.awsAccessKeyId as string,
      secretAccessKey: config.awsSecretAccessKey as string
    }
  })
  return cachedClient
}

const getBucket = (): string => {
  const config = useRuntimeConfig()
  return config.awsS3Bucket as string
}

/** URL/key-safe segment: lowercase, spaces -> dashes, strip anything else unsafe. */
export const slugifySegment = (value: string, fallback = 'general'): string => {
  const slug = (value ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || fallback
}

/**
 * Build the S3 object key for an attachment following the required layout:
 * Module/<user-company>/<Record name>/<what the photo is for>/<file>
 */
export const buildAttachmentKey = (opts: {
  module: string
  companySegment: string
  recordSegment: string
  purposeSegment: string
  fileName: string
}): string => {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const safeFileName = slugifySegment(opts.fileName.replace(/\.[^.]+$/, ''), 'file') +
    (opts.fileName.match(/\.[^.]+$/)?.[0]?.toLowerCase() ?? '')

  return [
    slugifySegment(opts.module),
    slugifySegment(opts.companySegment),
    slugifySegment(opts.recordSegment),
    slugifySegment(opts.purposeSegment),
    `${unique}-${safeFileName}`
  ].join('/')
}

export const uploadToS3 = async (key: string, body: Buffer, contentType: string): Promise<void> => {
  await getClient().send(new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    Body: body,
    ContentType: contentType
  }))
}

export const deleteFromS3 = async (key: string): Promise<void> => {
  await getClient().send(new DeleteObjectCommand({
    Bucket: getBucket(),
    Key: key
  }))
}

/** Short-lived signed URL so the bucket itself can stay private. */
export const getSignedViewUrl = async (key: string, fileName: string, expiresInSeconds = 300): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ResponseContentDisposition: `inline; filename="${fileName.replace(/"/g, '')}"`
  })
  return getSignedUrl(getClient(), command, { expiresIn: expiresInSeconds })
}
