export interface AppUser {
  id: number
  name: string
  username: string
  password: string
  role: 'user' | 'admin'
}

interface AuthResult {
  ok: boolean
  message: string
}

const USERS_KEY = 'insight_users'
const CURRENT_USER_KEY = 'insight_current_user'

const getSeedUsers = (): AppUser[] => [
  {
    id: 1,
    name: 'Administrator',
    username: 'admin',
    password: 'admin123',
    role: 'admin'
  }
]

export const useAuth = () => {
  const users = useState<AppUser[]>('auth-users', () => getSeedUsers())
  const currentUser = useState<AppUser | null>('auth-current-user', () => null)
  const initialized = useState<boolean>('auth-initialized', () => false)

  const persistUsers = () => {
    if (!import.meta.client) {
      return
    }

    localStorage.setItem(USERS_KEY, JSON.stringify(users.value))
  }

  const persistCurrentUser = () => {
    if (!import.meta.client) {
      return
    }

    if (!currentUser.value) {
      localStorage.removeItem(CURRENT_USER_KEY)
      return
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser.value))
  }

  const initAuth = () => {
    if (!import.meta.client || initialized.value) {
      return
    }

    const savedUsers = localStorage.getItem(USERS_KEY)
    const parsedUsers = savedUsers ? (JSON.parse(savedUsers) as AppUser[]) : []

    if (parsedUsers.length > 0) {
      users.value = parsedUsers
    } else {
      users.value = getSeedUsers()
      persistUsers()
    }

    const savedCurrentUser = localStorage.getItem(CURRENT_USER_KEY)
    currentUser.value = savedCurrentUser ? (JSON.parse(savedCurrentUser) as AppUser) : null

    initialized.value = true
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
    persistCurrentUser()

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
      role: 'user'
    }

    users.value = [...users.value, newUser]
    persistUsers()

    return {
      ok: true,
      message: 'Sign up successful. You can now log in.'
    }
  }

  const logout = () => {
    currentUser.value = null
    persistCurrentUser()
  }

  const isAdmin = computed(() => currentUser.value?.role === 'admin')

  return {
    users,
    currentUser,
    isAdmin,
    initAuth,
    login,
    signup,
    logout
  }
}
