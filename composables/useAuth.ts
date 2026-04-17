export interface AppUser {
  id: number
  name: string
  username: string
  password: string
  role: 'user' | 'admin' | 'staff'
  profile: UserProfile
}

export interface Company {
  id: number
  name: string
  linkedUserIds: number[]
  createdAt: string
}

export interface UserProfile {
  displayName: string
  phone: string
  location: string
  bio: string
  createdAt: string
}

interface AuthResult {
  ok: boolean
  message: string
}

interface JwtPayload {
  sub: number
  name: string
  username: string
  role: AppUser['role']
  iat: number
  exp: number
  jti: string
}

interface RevokedToken {
  jti: string
  exp: number
}

const USERS_KEY = 'insight_users'
const AUTH_TOKEN_KEY = 'insight_auth_token'
const REVOKED_TOKENS_KEY = 'insight_revoked_tokens'
const COMPANIES_KEY = 'insight_companies'
const JWT_SECRET = 'in-sight-jwt-secret-v1'
const SESSION_DURATION_SECONDS = 15 * 60

const buildDefaultProfile = (name: string): UserProfile => ({
  displayName: name,
  phone: '',
  location: '',
  bio: '',
  createdAt: new Date().toISOString()
})

const normalizeUser = (user: AppUser): AppUser => {
  const profile = user.profile ?? buildDefaultProfile(user.name)

  return {
    ...user,
    profile: {
      displayName: profile.displayName || user.name,
      phone: profile.phone || '',
      location: profile.location || '',
      bio: profile.bio || '',
      createdAt: profile.createdAt || new Date().toISOString()
    }
  }
}

const getSeedUsers = (): AppUser[] => [
  {
    id: 1,
    name: 'Administrator',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    profile: buildDefaultProfile('Administrator')
  }
]

export const useAuth = () => {
  const users = useState<AppUser[]>('auth-users', () => getSeedUsers())
  const currentUser = useState<AppUser | null>('auth-current-user', () => null)
  const authToken = useState<string | null>('auth-token', () => null)
  const initialized = useState<boolean>('auth-initialized', () => false)
  const companies = useState<Company[]>('auth-companies', () => [])

  const toBase64Url = (value: string) => {
    if (!import.meta.client || typeof btoa !== 'function') {
      return ''
    }

    const bytes = new TextEncoder().encode(value)
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('')
    const base64 = btoa(binary)

    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }

  const fromBase64Url = (value: string) => {
    if (!import.meta.client || typeof atob !== 'function') {
      return ''
    }

    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const decoded = atob(padded)
    const bytes = Uint8Array.from(decoded, char => char.charCodeAt(0))

    return new TextDecoder().decode(bytes)
  }

  const simpleSignature = (value: string) => {
    // Client-side signing is for tamper detection in this app context.
    let hash = 2166136261
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index)
      hash = Math.imul(hash, 16777619)
    }
    return toBase64Url(`${hash >>> 0}`)
  }

  const makeJti = () => {
    if (import.meta.client && typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }

    return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
  }

  const createToken = (user: AppUser, durationSeconds = SESSION_DURATION_SECONDS) => {
    const iat = Math.floor(Date.now() / 1000)
    const payload: JwtPayload = {
      sub: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      iat,
      exp: iat + durationSeconds,
      jti: makeJti()
    }

    const headerPart = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payloadPart = toBase64Url(JSON.stringify(payload))
    const signature = simpleSignature(`${headerPart}.${payloadPart}.${JWT_SECRET}`)

    return `${headerPart}.${payloadPart}.${signature}`
  }

  const parseTokenPayload = (token: string): JwtPayload | null => {
    try {
      const [headerPart, payloadPart, signature] = token.split('.')
      if (!headerPart || !payloadPart || !signature) {
        return null
      }

      const expected = simpleSignature(`${headerPart}.${payloadPart}.${JWT_SECRET}`)
      if (signature !== expected) {
        return null
      }

      return JSON.parse(fromBase64Url(payloadPart)) as JwtPayload
    } catch {
      return null
    }
  }

  const readRevokedTokens = (): RevokedToken[] => {
    if (!import.meta.client) {
      return []
    }

    try {
      const saved = localStorage.getItem(REVOKED_TOKENS_KEY)
      if (!saved) {
        return []
      }

      const parsed = JSON.parse(saved) as RevokedToken[]
      return parsed.filter(entry => entry.exp > Math.floor(Date.now() / 1000))
    } catch {
      return []
    }
  }

  const persistRevokedTokens = (tokens: RevokedToken[]) => {
    if (!import.meta.client) {
      return
    }

    localStorage.setItem(REVOKED_TOKENS_KEY, JSON.stringify(tokens))
  }

  const isTokenRevoked = (payload: JwtPayload) => {
    const revoked = readRevokedTokens()
    persistRevokedTokens(revoked)
    return revoked.some(entry => entry.jti === payload.jti)
  }

  const persistUsers = () => {
    if (!import.meta.client) {
      return
    }

    localStorage.setItem(USERS_KEY, JSON.stringify(users.value))
  }

  const persistCompanies = () => {
    if (!import.meta.client) {
      return
    }

    localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies.value))
  }

  const persistAuthToken = () => {
    if (!import.meta.client) {
      return
    }

    if (!authToken.value) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      return
    }

    localStorage.setItem(AUTH_TOKEN_KEY, authToken.value)
  }

  const clearAuthState = () => {
    currentUser.value = null
    authToken.value = null

    if (import.meta.client) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
    }
  }

  const resolveUserFromPayload = (payload: JwtPayload): AppUser | null => {
    const matched = users.value.find(user => {
      return user.id === payload.sub && user.username.toLowerCase() === payload.username.toLowerCase()
    })

    return matched ?? null
  }

  const applyToken = (token: string) => {
    const payload = parseTokenPayload(token)
    if (!payload) {
      return false
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return false
    }

    if (isTokenRevoked(payload)) {
      return false
    }

    const matchedUser = resolveUserFromPayload(payload)
    if (!matchedUser) {
      return false
    }

    currentUser.value = matchedUser
    authToken.value = token
    persistAuthToken()
    return true
  }

  const issueTokenForCurrentUser = () => {
    if (!currentUser.value) {
      clearAuthState()
      return
    }

    authToken.value = createToken(currentUser.value)
    persistAuthToken()
  }

  const revokeCurrentToken = () => {
    if (!authToken.value) {
      return
    }

    const payload = parseTokenPayload(authToken.value)
    if (!payload) {
      return
    }

    const revoked = readRevokedTokens()
    if (revoked.some(entry => entry.jti === payload.jti)) {
      persistRevokedTokens(revoked)
      return
    }

    revoked.push({
      jti: payload.jti,
      exp: payload.exp
    })
    persistRevokedTokens(revoked)
  }

  const initAuth = () => {
    if (!import.meta.client || initialized.value) {
      return
    }

    const savedUsers = localStorage.getItem(USERS_KEY)
    const parsedUsers = savedUsers ? (JSON.parse(savedUsers) as AppUser[]) : []

    if (parsedUsers.length > 0) {
      users.value = parsedUsers.map(user => normalizeUser(user))
      persistUsers()
    } else {
      users.value = getSeedUsers()
      persistUsers()
    }

    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    authToken.value = savedToken || null

    if (!savedToken || !applyToken(savedToken)) {
      clearAuthState()
    }

    try {
      const savedCompanies = localStorage.getItem(COMPANIES_KEY)
      companies.value = savedCompanies ? (JSON.parse(savedCompanies) as Company[]) : []
    } catch {
      companies.value = []
    }

    initialized.value = true
  }

  const ensureValidSession = () => {
    if (!import.meta.client) {
      return Boolean(currentUser.value)
    }

    if (!initialized.value) {
      initAuth()
    }

    const storedToken = authToken.value || localStorage.getItem(AUTH_TOKEN_KEY)
    if (!storedToken) {
      clearAuthState()
      return false
    }

    if (!applyToken(storedToken)) {
      clearAuthState()
      return false
    }

    return true
  }

  const login = (username: string, password: string): AuthResult => {
    const normalized = username.trim().toLowerCase()
    const user = users.value.find(
      record => record.username.toLowerCase() === normalized && record.password === password
    )

    if (!user) {
      return {
        ok: false,
        message: 'Invalid username or password.'
      }
    }

    currentUser.value = user
    issueTokenForCurrentUser()

    return {
      ok: true,
      message: 'Login successful.'
    }
  }

  const signup = (name: string, username: string, password: string): AuthResult => {
    const normalizedName = name.trim()
    const normalizedUsername = username.trim()

    if (!normalizedName || !normalizedUsername || !password) {
      return {
        ok: false,
        message: 'Please complete all sign up fields.'
      }
    }

    const exists = users.value.some(
      user => user.username.toLowerCase() === normalizedUsername.toLowerCase()
    )

    if (exists) {
      return {
        ok: false,
        message: 'That username is already taken.'
      }
    }

    const newUser: AppUser = {
      id: Date.now(),
      name: normalizedName,
      username: normalizedUsername,
      password,
      role: 'user',
      profile: buildDefaultProfile(normalizedName)
    }

    users.value = [...users.value, newUser]
    persistUsers()

    return {
      ok: true,
      message: 'Sign up successful. You can now log in.'
    }
  }

  const logout = () => {
    revokeCurrentToken()
    clearAuthState()
  }

  const refreshToken = () => {
    if (!ensureValidSession()) {
      return false
    }

    issueTokenForCurrentUser()
    return true
  }

  const updateProfile = (input: { displayName: string; phone: string; location: string; bio: string }): AuthResult => {
    if (!currentUser.value) {
      return {
        ok: false,
        message: 'You must be logged in to update profile.'
      }
    }

    const normalizedDisplayName = input.displayName.trim()
    if (!normalizedDisplayName) {
      return {
        ok: false,
        message: 'Display name is required.'
      }
    }

    users.value = users.value.map(user => {
      if (user.id !== currentUser.value?.id) {
        return user
      }

      return {
        ...user,
        name: normalizedDisplayName,
        profile: {
          ...user.profile,
          displayName: normalizedDisplayName,
          phone: input.phone.trim(),
          location: input.location.trim(),
          bio: input.bio.trim()
        }
      }
    })

    const updated = users.value.find(user => user.id === currentUser.value?.id)
    if (updated) {
      currentUser.value = updated
      issueTokenForCurrentUser()
    }

    persistUsers()

    return {
      ok: true,
      message: 'Profile updated successfully.'
    }
  }

  const createUser = (name: string, username: string, password: string, role: AppUser['role']): AuthResult => {
    const normalizedName = name.trim()
    const normalizedUsername = username.trim()

    if (!normalizedName || !normalizedUsername || !password) {
      return { ok: false, message: 'Please fill in all required fields.' }
    }

    const exists = users.value.some(
      u => u.username.toLowerCase() === normalizedUsername.toLowerCase()
    )

    if (exists) {
      return { ok: false, message: 'That username is already taken.' }
    }

    const newUser: AppUser = {
      id: Date.now(),
      name: normalizedName,
      username: normalizedUsername,
      password,
      role,
      profile: buildDefaultProfile(normalizedName)
    }

    users.value = [...users.value, newUser]
    persistUsers()

    return { ok: true, message: `User "${normalizedName}" created successfully.` }
  }

  const getCompanies = () => [...companies.value]

  const createCompany = (name: string): AuthResult => {
    const normalizedName = name.trim()

    if (!normalizedName) {
      return { ok: false, message: 'Company name is required.' }
    }

    const exists = companies.value.some(
      c => c.name.toLowerCase() === normalizedName.toLowerCase()
    )

    if (exists) {
      return { ok: false, message: 'A company with that name already exists.' }
    }

    const newCompany: Company = {
      id: Date.now(),
      name: normalizedName,
      linkedUserIds: [],
      createdAt: new Date().toISOString()
    }

    companies.value = [...companies.value, newCompany]
    persistCompanies()

    return { ok: true, message: `Company "${normalizedName}" created.` }
  }

  const linkUserToCompany = (companyId: number, userId: number) => {
    companies.value = companies.value.map(c => {
      if (c.id !== companyId || c.linkedUserIds.includes(userId)) {
        return c
      }
      return { ...c, linkedUserIds: [...c.linkedUserIds, userId] }
    })
    persistCompanies()
  }

  const unlinkUserFromCompany = (companyId: number, userId: number) => {
    companies.value = companies.value.map(c => {
      if (c.id !== companyId) {
        return c
      }
      return { ...c, linkedUserIds: c.linkedUserIds.filter(id => id !== userId) }
    })
    persistCompanies()
  }

  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isAuthenticated = computed(() => Boolean(currentUser.value && authToken.value))

  return {
    users,
    currentUser,
    authToken,
    isAdmin,
    isAuthenticated,
    initAuth,
    ensureValidSession,
    login,
    signup,
    updateProfile,
    refreshToken,
    logout,
    createUser,
    companies,
    getCompanies,
    createCompany,
    linkUserToCompany,
    unlinkUserFromCompany
  }
}
