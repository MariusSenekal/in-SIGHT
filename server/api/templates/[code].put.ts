// PUT /api/templates/[code]
// Upserts a checklist template for a record code. Admin/staff only.
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event, ['admin', 'staff', 'cleaner'])
  const token = getBearerToken(event)!
  const code = getRouterParam(event, 'code')!.trim().toUpperCase()
  const { tasks } = await readBody<{ tasks: string[] }>(event)

  const cleanTasks = (tasks ?? []).map(t => t.trim()).filter(Boolean)

  // Upsert the template header
  await pgrest('/checklist_templates', {
    method: 'POST',
    token,
    body: {
      record_code: code,
      updated_by: payload.name,
      updated_at: new Date().toISOString()
    },
    extraHeaders: { 'Prefer': 'resolution=merge-duplicates,return=minimal' }
  })

  // Replace all task rows: delete existing then insert new
  await pgrest('/checklist_template_tasks', {
    method: 'DELETE',
    token,
    query: { record_code: `eq.${code}` }
  })

  if (cleanTasks.length) {
    await pgrest('/checklist_template_tasks', {
      method: 'POST',
      token,
      body: cleanTasks.map((task, i) => ({ record_code: code, task, sort_order: i })),
      extraHeaders: { 'Prefer': 'return=minimal' }
    })
  }

  return { recordCode: code, tasks: cleanTasks, updatedBy: payload.name }
})
