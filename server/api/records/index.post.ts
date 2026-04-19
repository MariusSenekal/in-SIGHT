// POST /api/records
// Admin/staff creates a new QR record.
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const generateCode = () => {
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return `REC-${suffix}`
}

export default defineEventHandler(async (event) => {
  requireAuth(event, ['admin', 'staff'])
  const token = getBearerToken(event)!

  const { name, description, type, location, ownerUserId, ownerCompanyId } = await readBody<{
    name: string
    description?: string
    type?: string
    location?: string
    ownerUserId?: number | null
    ownerCompanyId?: number | null
  }>(event)

  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Record name is required.' })

  // Generate a unique code (retry on collision)
  let code = generateCode()
  let attempts = 0
  while (attempts < 10) {
    const existing = await pgrest<any[]>('/records', {
      token,
      query: { code: `eq.${code}`, select: 'id' }
    })
    if (!existing?.length) break
    code = generateCode()
    attempts++
  }

  const rows = await pgrest<any[]>('/records', {
    method: 'POST',
    token,
    body: {
      code,
      name: name.trim(),
      description: description?.trim() ?? '',
      type: type?.trim() ?? '',
      location: location?.trim() ?? '',
      owner_user_id: ownerUserId ?? null,
      owner_company_id: ownerCompanyId ?? null
    },
    extraHeaders: { 'Prefer': 'return=representation' }
  })

  const r = rows[0]
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    description: r.description,
    type: r.type,
    location: r.location,
    ownerUserId: r.owner_user_id ?? null,
    ownerCompanyId: r.owner_company_id ?? null,
    createdAt: r.created_at
  }
})
