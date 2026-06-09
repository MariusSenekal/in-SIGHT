// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  displayName: string
  phone: string
  location: string
  bio: string
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

// ─── Token helpers (client-side decode only — verification is server-side) ───

const AUTH_TOKEN_KEY = 'insight_auth_token'

const decodeTokenPayload = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

const isTokenExpired = (token: string): boolean => {
  const payload = decodeTokenPayload(token)
  if (!payload || typeof payload.exp !== 'number') return true
  return payload.exp <= Math.floor(Date.now() / 1000)
}

const buildUserFromPayload = (payload: Record<string, unknown>): AppUser => ({
  id: Number(payload.sub),
  name: payload.name as string,
  username: payload.username as string,
  role: payload.app_role as AppUser['role'],
  profile: {
    displayName: payload.name as string,
    phone: '',
    location: '',
    bio: '',
    createdAt: new Date().toISOString()
  }
})

// ─── Composable ───────────────────────────────────────────────────────────────

export const useAuth = () => {
  const currentUser = useState<AppUser | null>('auth-current-user', () => null)
  const authToken = useState<string | null>('auth-token', () => null)
  const initialized = useState<boolean>('auth-initialized', () => false)

  // Shared reactive user + company lists (populated by loadUsers/loadCompanies)
  const users = useState<AppUser[]>('auth-users', () => [])
  const companies = useState<Company[]>('auth-companies', () => [])
  const records = useState<any[]>('records', () => [])
  const serviceRequests = useState<any[]>('service-requests', () => [])

  const clearAuthState = () => {
    currentUser.value = null
    authToken.value = null
    if (import.meta.client) localStorage.removeItem(AUTH_TOKEN_KEY)
  }

  const clearDomainState = () => {
    users.value = []
    companies.value = []
    records.value = []
    serviceRequests.value = []
  }

  const applyStoredToken = (token: string): boolean => {
    if (isTokenExpired(token)) return false
    const payload = decodeTokenPayload(token)
    if (!payload) return false
    currentUser.value = buildUserFromPayload(payload)
    authToken.value = token
    return true
  }

  const initAuth = () => {
    if (!import.meta.client || initialized.value) return
    const stored = localStorage.getItem(AUTH_TOKEN_KEY)
    if (stored && applyStoredToken(stored)) {
      // token is valid — keep it
    } else {
      clearAuthState()
    }
    initialized.value = true
  }

  const ensureValidSession = (): boolean => {
    if (!import.meta.client) return Boolean(currentUser.value)
    if (!initialized.value) initAuth()
    const token = authToken.value ?? localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token || !applyStoredToken(token)) {
      clearAuthState()
      return false
    }
    return true
  }

  // ── Auth actions ──────────────────────────────────────────────────────────

  const login = async (username: string, password: string): Promise<AuthResult> => {
    try {
      clearDomainState()
      const { token, user } = await $fetch<{ token: string; user: AppUser }>('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })
      authToken.value = token
      if (import.meta.client) localStorage.setItem(AUTH_TOKEN_KEY, token)
      const payload = decodeTokenPayload(token) ?? {}
      currentUser.value = { ...user, profile: buildUserFromPayload(payload).profile }
      return { ok: true, message: 'Login successful.' }
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Invalid username or password.'
      return { ok: false, message: msg }
    }
  }

  const signup = async (name: string, username: string, password: string): Promise<AuthResult> => {
    try {
      clearDomainState()
      const { token, user } = await $fetch<{ token: string; user: AppUser }>('/api/auth/register', {
        method: 'POST',
        body: { name, username, password }
      })
      authToken.value = token
      if (import.meta.client) localStorage.setItem(AUTH_TOKEN_KEY, token)
      const payload = decodeTokenPayload(token) ?? {}
      currentUser.value = { ...user, profile: buildUserFromPayload(payload).profile }
      return { ok: true, message: 'Account created successfully.' }
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Registration failed.'
      return { ok: false, message: msg }
    }
  }

  const logout = async () => {
    try {
      if (authToken.value) {
        await $fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken.value}` }
        })
      }
    } catch { /* non-fatal */ }
    
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
    if (!authToken.value || isTokenExpired(authToken.value)) return false
    try {
      const { token } = await $fetch<{ token: string }>('/api/auth/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken.value}` }
      })
      authToken.value = token
      if (import.meta.client) localStorage.setItem(AUTH_TOKEN_KEY, token)
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
        headers: { Authorization: `Bearer ${authToken.value}` },
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
        headers: { Authorization: `Bearer ${authToken.value}` }
      })
    } catch { users.value = [] }
  }

  const createUser = async (
    name: string, username: string, password: string, role: AppUser['role']
  ): Promise<AuthResult> => {
    try {
      const created = await $fetch<AppUser>('/api/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken.value}` },
        body: { name, username, password, role }
      })
      users.value = [
        ...users.value,
        {
          ...created,
          profile: { displayName: created.name, phone: '', location: '', bio: '', createdAt: new Date().toISOString() }
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
        headers: { Authorization: `Bearer ${authToken.value}` }
      })
    } catch { companies.value = [] }
  }

  const getCompanies = () => [...companies.value]

  const createCompany = async (name: string): Promise<AuthResult> => {
    try {
      const created = await $fetch<Company>('/api/companies', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken.value}` },
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
        headers: { Authorization: `Bearer ${authToken.value}` },
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
        headers: { Authorization: `Bearer ${authToken.value}` },
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
        headers: { Authorization: `Bearer ${authToken.value}` },
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
        headers: { Authorization: `Bearer ${authToken.value}` }
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
  const isAuthenticated = computed(() => Boolean(currentUser.value && authToken.value))

  return {
    users,
    currentUser,
    authToken,
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
    signup,
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
    unlinkUserFromCompany
  }
}
