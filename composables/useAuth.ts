// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  displayName: string
  phone: string
  location: string
  bio: string
  theme: string
  createdAt: string
}

export interface AppUser {
  id: number
  name: string
  username: string
  role: 'user' | 'admin' | 'staff' | 'cleaner' | 'uv-hero' | 'client_admin' | 'client_technician'
  isActive?: boolean
  profile: UserProfile
  createdAt?: string
}

export interface Company {
  id: number
  name: string
  linkedUserIds: number[]
  createdAt: string
}

interface AuthResult {
  ok: boolean
  message: string
}

// ─── Session ─────────────────────────────────────────────────────────────────
// Sessions live in the database (insight.user_sessions). The browser only holds
// an HttpOnly cookie it cannot read; nothing about the login is kept in
// localStorage. The current user always comes from GET /api/auth/session.

const defaultProfile = (displayName: string): UserProfile => ({
  displayName,
  phone: '',
  location: '',
  bio: '',
  theme: 'inSight',
  createdAt: new Date().toISOString()
})

// Shared in-flight session lookup so concurrent initAuth() calls make one request.
let initPromise: Promise<void> | null = null

// ─── Composable ───────────────────────────────────────────────────────────────

export const useAuth = () => {
  const currentUser = useState<AppUser | null>('auth-current-user', () => null)
  const initialized = useState<boolean>('auth-initialized', () => false)

  // Shared reactive user + company lists (populated by loadUsers/loadCompanies)
  const users = useState<AppUser[]>('auth-users', () => [])
  const companies = useState<Company[]>('auth-companies', () => [])
  const records = useState<any[]>('records', () => [])
  const serviceRequests = useState<any[]>('service-requests', () => [])
  const userModulePermissions = useState<string[]>('user-module-permissions', () => [])

  const clearAuthState = () => {
    currentUser.value = null
  }

  const clearDomainState = () => {
    users.value = []
    companies.value = []
    records.value = []
    serviceRequests.value = []
    userModulePermissions.value = []
  }

  const loadSession = async () => {
    try {
      const { user } = await $fetch<{ user: AppUser }>('/api/auth/session')
      currentUser.value = { ...user, profile: defaultProfile(user.name) }
    } catch {
      clearAuthState()
      return
    }
    // Load profile (theme) and module permissions for the session's user.
    try {
      const profile = await $fetch<AppUser>('/api/profile')
      if (profile && currentUser.value) {
        currentUser.value.profile = profile.profile
        if (profile.profile?.theme) {
          const { initTheme } = useAppTheme()
          initTheme(profile.profile.theme)
        }
      }
      await loadUserModules()
    } catch (error) {
      console.warn('Could not load profile on init:', error)
    }
  }

  const initAuth = async () => {
    if (!import.meta.client || initialized.value) return
    // Remove the token left behind by the old localStorage-based login.
    localStorage.removeItem('insight_auth_token')
    initPromise ??= loadSession().finally(() => {
      initialized.value = true
      initPromise = null
    })
    await initPromise
  }

  const ensureValidSession = (): boolean => Boolean(currentUser.value)

  // ── Auth actions ──────────────────────────────────────────────────────────

  const login = async (username: string, password: string): Promise<AuthResult> => {
    try {
      clearDomainState()
      // Never carry a previous user's real-time connection into a new session
      useSocket().disconnect()
      const { user } = await $fetch<{ user: AppUser }>('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })
      currentUser.value = { ...user, profile: defaultProfile(user.name) }
      initialized.value = true
      
      // Initialize theme from user profile
      if (import.meta.client && user.profile?.theme) {
        const { initTheme } = useAppTheme()
        initTheme(user.profile.theme)
      }
      
      // Load module permissions
      await loadUserModules()
      
      return { ok: true, message: 'Login successful.' }
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Invalid username or password.'
      return { ok: false, message: msg }
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch { /* non-fatal */ }

    // Drop the real-time connection so it can't keep receiving this user's events
    useSocket().disconnect()

    // Clear all auth state
    clearAuthState()
    
    // Clear any cached data
    clearDomainState()
    initialized.value = false
    
    // Clear session storage if on client
    if (import.meta.client) {
      sessionStorage.clear()
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    if (!currentUser.value) return false
    try {
      await $fetch('/api/auth/refresh', { method: 'POST' })
      return true
    } catch {
      return false
    }
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  const updateProfile = async (input: {
    displayName: string; phone: string; location: string; bio: string
  }): Promise<AuthResult> => {
    if (!currentUser.value) return { ok: false, message: 'Not logged in.' }
    try {
      await $fetch('/api/profile', {
        method: 'PATCH',
        body: input
      })
      currentUser.value = {
        ...currentUser.value,
        name: input.displayName.trim(),
        profile: { ...currentUser.value.profile, ...input }
      }
      return { ok: true, message: 'Profile updated successfully.' }
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Update failed.'
      return { ok: false, message: msg }
    }
  }

  // ── User management (admin/staff) ─────────────────────────────────────────

  const loadUsers = async () => {
    try {
      users.value = await $fetch<AppUser[]>('/api/users', {
      })
    } catch { users.value = [] }
  }

  const createUser = async (
    name: string, username: string, password: string, role: AppUser['role']
  ): Promise<AuthResult> => {
    try {
      const created = await $fetch<AppUser>('/api/users', {
        method: 'POST',
        body: { name, username, password, role }
      })
      users.value = [
        ...users.value,
        {
          ...created,
          profile: { displayName: created.name, phone: '', location: '', bio: '', theme: 'inSight', createdAt: new Date().toISOString() }
        }
      ]
      return { ok: true, message: `User "${name}" created successfully.` }
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'User creation failed.'
      return { ok: false, message: msg }
    }
  }

  // ── Company management ────────────────────────────────────────────────────

  const loadCompanies = async () => {
    try {
      companies.value = await $fetch<Company[]>('/api/companies', {
      })
    } catch { companies.value = [] }
  }

  const getCompanies = () => [...companies.value]

  const createCompany = async (name: string): Promise<AuthResult> => {
    try {
      const created = await $fetch<Company>('/api/companies', {
        method: 'POST',
        body: { name }
      })
      companies.value = [...companies.value, created]
      return { ok: true, message: `Company "${name}" created.` }
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to create company.'
      return { ok: false, message: msg }
    }
  }

  const linkUserToCompany = async (companyId: number, userId: number) => {
    try {
      await $fetch('/api/companies/link', {
        method: 'POST',
        body: { companyId, userId, action: 'link' }
      })
      companies.value = companies.value.map(c =>
        c.id !== companyId || c.linkedUserIds.includes(userId)
          ? c
          : { ...c, linkedUserIds: [...c.linkedUserIds, userId] }
      )
    } catch { /* ignore */ }
  }

  const unlinkUserFromCompany = async (companyId: number, userId: number) => {
    try {
      await $fetch('/api/companies/link', {
        method: 'POST',
        body: { companyId, userId, action: 'unlink' }
      })
      companies.value = companies.value.map(c =>
        c.id !== companyId
          ? c
          : { ...c, linkedUserIds: c.linkedUserIds.filter(id => id !== userId) }
      )
    } catch { /* ignore */ }
  }

  const updateUser = async (
    userId: number,
    input: {
      name?: string
      username?: string
      role?: AppUser['role']
      isActive?: boolean
      displayName?: string
      phone?: string
      location?: string
      bio?: string
      newPassword?: string
    }
  ): Promise<AuthResult> => {
    try {
      await $fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        body: input
      })
      // Update local state
      users.value = users.value.map(u => {
        if (u.id !== userId) return u
        return {
          ...u,
          name:     input.name     ?? u.name,
          username: input.username ?? u.username,
          role:     input.role     ?? u.role,
          isActive: input.isActive ?? u.isActive,
          profile: {
            ...u.profile,
            displayName: input.displayName ?? u.profile?.displayName ?? u.name,
            phone:       input.phone       ?? u.profile?.phone       ?? '',
            location:    input.location    ?? u.profile?.location    ?? '',
            bio:         input.bio         ?? u.profile?.bio         ?? ''
          }
        }
      })
      return { ok: true, message: 'User updated successfully.' }
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Update failed.'
      return { ok: false, message: msg }
    }
  }

  const deleteUser = async (userId: number): Promise<AuthResult> => {
    try {
      await $fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })
      users.value = users.value.filter(u => u.id !== userId)
      // Remove from companies
      companies.value = companies.value.map(c => ({
        ...c,
        linkedUserIds: c.linkedUserIds.filter(id => id !== userId)
      }))
      return { ok: true, message: 'User deleted.' }
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Delete failed.'
      return { ok: false, message: msg }
    }
  }

  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isCleaner = computed(() => currentUser.value?.role === 'cleaner')
  const isUvHero = computed(() => currentUser.value?.role === 'uv-hero')
  const isStaff = computed(() => currentUser.value?.role === 'staff')
  const isClientAdmin = computed(() => currentUser.value?.role === 'client_admin')
  const isClientTechnician = computed(() => currentUser.value?.role === 'client_technician')
  const isStaffOrCleaner = computed(() =>
    currentUser.value?.role === 'staff' || currentUser.value?.role === 'cleaner'
  )
  const isStaffOrCleanerOrUvHero = computed(() =>
    currentUser.value?.role === 'staff' || 
    currentUser.value?.role === 'cleaner' || 
    currentUser.value?.role === 'uv-hero'
  )
  const isAuthenticated = computed(() => Boolean(currentUser.value))

  // ── Module Permissions ────────────────────────────────────────────────────

  const loadUserModules = async (userId?: number): Promise<void> => {
    const targetUserId = userId ?? currentUser.value?.id
    if (!targetUserId) return

    try {
      const result = await $fetch<{ modules: string[] }>(`/api/users/${targetUserId}/modules`, {
      })
      userModulePermissions.value = result.modules || []
    } catch (err) {
      console.error('Failed to load user modules:', err)
      userModulePermissions.value = []
    }
  }

  const updateUserModules = async (userId: number, modules: string[]): Promise<AuthResult> => {
    try {
      await $fetch(`/api/users/${userId}/modules`, {
        method: 'PUT',
        body: { modules }
      })
      // Refresh current user's permissions if they're the target
      if (userId === currentUser.value?.id) {
        await loadUserModules()
      }
      return { ok: true, message: 'Module permissions updated successfully.' }
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Update failed.'
      return { ok: false, message: msg }
    }
  }

  const hasModuleAccess = (module: string): boolean => {
    // Admins have access to all modules
    if (isAdmin.value) return true
    
    // Client technicians have default access to vehicle and equipment
    if (isClientTechnician.value && (module === 'vehicle' || module === 'equipment')) {
      return true
    }
    
    // Check explicit permissions for other roles
    return userModulePermissions.value.includes(module)
  }

  const getAvailableModules = computed(() => {
    // Admins have access to all modules
    if (isAdmin.value) {
      return ['vehicle', 'equipment', 'cleaning', 'qr-codes', 'clients', 'hr']
    }
    
    // Client technicians have default access to vehicle and equipment
    if (isClientTechnician.value) {
      const defaultModules = ['vehicle', 'equipment']
      // Merge with any additional granted permissions
      return [...new Set([...defaultModules, ...userModulePermissions.value])]
    }
    
    // For other roles, return only granted permissions
    return userModulePermissions.value
  })

  return {
    users,
    currentUser,
    isAdmin,
    isCleaner,
    isUvHero,
    isStaff,
    isClientAdmin,
    isClientTechnician,
    isStaffOrCleaner,
    isStaffOrCleanerOrUvHero,
    isAuthenticated,
    initAuth,
    ensureValidSession,
    login,
    updateProfile,
    refreshToken,
    logout,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    companies,
    getCompanies,
    loadCompanies,
    createCompany,
    linkUserToCompany,
    unlinkUserFromCompany,
    userModulePermissions,
    loadUserModules,
    updateUserModules,
    hasModuleAccess,
    getAvailableModules
  }
}
