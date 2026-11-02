import type { JwtPayload } from './jwt'
import { pgrestAdmin } from './pgrest'
import { attachmentModules, recordDisplayName } from './attachmentModules'

export interface OwnedRecord {
  id: number
  owner_user_id: number | null
  owner_company_id: number | null
  [key: string]: unknown
}

/**
 * Loads the parent record for an attachment operation and enforces the same
 * ownership rule used by the clients/staff endpoints: client_admin can only
 * reach records owned by their own companies (or by them personally, for
 * records with no company at all). Admin/staff always pass.
 * Throws 403/404 and never returns a record the caller shouldn't see.
 */
export const loadOwnedRecordOrDeny = async (
  payload: JwtPayload,
  moduleKey: string,
  recordId: number,
  allowedAppRoles: string[]
): Promise<{ record: OwnedRecord; companySegment: string; recordSegment: string }> => {
  const config = attachmentModules[moduleKey]
  if (!config) {
    throw createError({ statusCode: 400, message: 'Unknown module.' })
  }
  if (!allowedAppRoles.includes(payload.app_role)) {
    throw createError({ statusCode: 403, message: 'Access denied.' })
  }

  const rows = await pgrestAdmin<OwnedRecord[]>(config.table, {
    query: { id: `eq.${recordId}`, select: '*' }
  })
  const record = rows?.[0]
  if (!record) {
    throw createError({ statusCode: 404, message: 'Record not found.' })
  }

  if (payload.app_role === 'client_admin' || payload.app_role === 'client_technician') {
    const memberships = await pgrestAdmin<Array<{ company_id: number }>>('/company_users', {
      query: { user_id: `eq.${payload.sub}`, select: 'company_id' }
    })
    const companyIds = (memberships ?? []).map((m) => Number(m.company_id)).filter(Number.isFinite)
    const currentUserId = Number(payload.sub)
    const ownerUserId = record.owner_user_id == null ? null : Number(record.owner_user_id)
    const ownerCompanyId = record.owner_company_id == null ? null : Number(record.owner_company_id)

    const canAccess = companyIds.length > 0
      ? (ownerUserId != null && ownerUserId === currentUserId) || (ownerCompanyId != null && companyIds.includes(ownerCompanyId))
      : (ownerUserId != null && ownerUserId === currentUserId) || (ownerUserId == null && ownerCompanyId == null)

    if (!canAccess) {
      throw createError({ statusCode: 404, message: 'Record not found.' })
    }
  }

  let companySegment = `user-${record.owner_user_id ?? 'unassigned'}`
  if (record.owner_company_id) {
    const companies = await pgrestAdmin<Array<{ id: number; name: string }>>('/companies', {
      query: { id: `eq.${record.owner_company_id}`, select: 'id,name' }
    })
    if (companies?.[0]?.name) companySegment = companies[0].name
  }

  return {
    record,
    companySegment,
    recordSegment: recordDisplayName(config, record)
  }
}
