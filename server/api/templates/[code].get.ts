// GET /api/templates/[code]
// Returns the checklist template for a record code (creates default if none exists).
import { requireAuth, pgrest, getBearerToken } from '../../utils/pgrest'

const DEFAULT_TASKS = ['Cleaning check completed', 'Cleaning completed']

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const token = getBearerToken(event)!
  const code = getRouterParam(event, 'code')!.trim().toUpperCase()

  const rows = await pgrest<any[]>('/checklist_templates', {
    token,
    query: {
      record_code: `eq.${code}`,
      select: '*,checklist_template_tasks(id,task,sort_order)'
    }
  })

  if (rows?.length) {
    const t = rows[0]
    return {
      recordCode: t.record_code,
      updatedAt: t.updated_at,
      updatedBy: t.updated_by,
      tasks: (t.checklist_template_tasks ?? [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((t: any) => t.task)
    }
  }

  // Create default template
  return {
    recordCode: code,
    updatedAt: new Date().toISOString(),
    updatedBy: 'System',
    tasks: DEFAULT_TASKS
  }
})
