export default defineNuxtRouteMiddleware((to, from) => {
  if (!import.meta.client) {
    return
  }

  const previousPath = useState<string | null>('nav-previous-path', () => null)
  const currentPath = useState<string | null>('nav-current-path', () => null)

  if (from.fullPath && from.fullPath !== to.fullPath) {
    previousPath.value = from.fullPath
  }

  currentPath.value = to.fullPath

  const { initAuth, ensureValidSession, isAdmin } = useAuth()
  initAuth()

  const isPublicRoute = to.path === '/' || to.path.startsWith('/scan')
  if (isPublicRoute) {
    return
  }

  if (!ensureValidSession()) {
    return navigateTo('/')
  }

  if (to.path.startsWith('/dashboard') && !isAdmin.value) {
    return navigateTo('/')
  }
})
