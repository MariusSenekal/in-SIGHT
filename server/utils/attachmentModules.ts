// Registry of modules that can have attachments. Adding a new module (vehicles,
// equipment, clients, ...) to the UI later only requires wiring the frontend —
// this table-agnostic backend already supports all of them.
export interface AttachmentModuleConfig {
  table: string
  nameFields: string[]
}

export const attachmentModules: Record<string, AttachmentModuleConfig> = {
  hr: { table: '/staff_members', nameFields: ['name', 'surname'] },
  clients: { table: '/clients', nameFields: ['company_name'] },
  vehicles: { table: '/vehicles', nameFields: ['make', 'model', 'registration_number'] },
  equipment: { table: '/equipment', nameFields: ['name'] }
}

export const recordDisplayName = (
  config: AttachmentModuleConfig,
  record: Record<string, unknown>
): string => {
  const parts = config.nameFields
    .map((field) => record[field])
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
  return parts.length ? parts.join(' ') : `record-${record.id ?? ''}`
}
