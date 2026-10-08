// GET /api/auth/session
// Returns the user that owns this browser's database session, or 401.
export default defineEventHandler((event) => {
  const session = event.context.session
  if (!session) {
    throw createError({ statusCode: 401, message: 'Not logged in.' })
  }
  return {
    user: {
      id: session.id,
      name: session.name,
      username: session.username,
      role: session.role
    }
  }
})
