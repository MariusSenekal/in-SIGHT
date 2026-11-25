// GET /api/notification-preferences
// Returns the current user's notification settings for every type,
// filling in defaults (90/30/1 days before, 10:00 SAST, enabled) for any
// type they've never saved a preference for.
import { requireAuth } from '~/server/utils/pgrest'
import { getUserPreferences, resolvePreference, type NotificationType } from '~/server/utils/notificationPreferences'

const ALL_TYPES: NotificationType[] = ['next_service_due', 'contract_renewal', 'birthday']

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)
  const userId = Number(payload.sub)

  const byType = await getUserPreferences(userId)

  return ALL_TYPES.map((type) => {
    const pref = resolvePreference(byType, userId, type)
    return {
      type: pref.type,
      enabled: pref.enabled,
      intervalDays: pref.intervalDays,
      sendTimeSast: pref.sendTimeSast
    }
  })
})
