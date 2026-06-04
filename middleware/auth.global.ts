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

  const { initAuth, ensureValidSession, isAdmin, isStaff, isClientAdmin, isClientTechnician } = useAuth()
  initAuth()

  const isPublicRoute = to.path === '/' || to.path.startsWith('/scan')
  if (isPublicRoute) {
    return
  }

  if (!ensureValidSession()) {
    return navigateTo('/')
  }

  // Block dashboard routes for non-admin users
  if (to.path.startsWith('/dashboard') && !isAdmin.value) {
    return navigateTo('/')
  }

  // Block QR codes module - only admins can access
  if (to.path.startsWith('/modules/qr-codes') && !isAdmin.value) {
    return navigateTo('/modules')
  }

  // Client technicians: Allow ONLY vehicle and equipment tracking pages
  if (isClientTechnician.value && to.path.startsWith('/modules')) {
    const isVehicleOrEquipmentPage = to.path.startsWith('/modules/vehicles/') || to.path.startsWith('/modules/equipment/')
    if (!isVehicleOrEquipmentPage) {
      return navigateTo('/')
    }
  }

  // Block modules routes for users who are not client admins/technicians/staff
  if (to.path.startsWith('/modules') && !isClientAdmin.value && !isClientTechnician.value && !isAdmin.value && !isStaff.value) {
    return navigateTo('/')
  }

  // Block /records browsing page for client technicians - they can only view via scan
  if (to.path === '/records' && isClientTechnician.value) {
    return navigateTo('/')
  }
})
