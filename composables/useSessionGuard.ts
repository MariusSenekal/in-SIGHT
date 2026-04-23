const WARNING_AFTER_MS = 14 * 60 * 1000
const LOGOUT_COUNTDOWN_SECONDS = 60
const TOKEN_REFRESH_INTERVAL_MS = 30 * 1000

let warningTimer: ReturnType<typeof setTimeout> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null
let listenersBound = false

const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'] as const

export const useSessionGuard = () => {
  const { isAuthenticated, refreshToken, logout, initAuth } = useAuth()

  const showSessionModal = useState<boolean>('session-modal-open', () => false)
  const countdownSeconds = useState<number>('session-countdown-seconds', () => LOGOUT_COUNTDOWN_SECONDS)
  const lastTokenRefreshMs = useState<number>('session-last-token-refresh', () => 0)

  const countdownLabel = computed(() => {
    const minutes = Math.floor(countdownSeconds.value / 60)
    const seconds = countdownSeconds.value % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  const clearTimers = () => {
    if (warningTimer) {
      clearTimeout(warningTimer)
      warningTimer = null
    }

    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }

  const hidePrompt = () => {
    showSessionModal.value = false
    countdownSeconds.value = LOGOUT_COUNTDOWN_SECONDS
  }

  const detachListeners = () => {
    if (!import.meta.client || !listenersBound) {
      return
    }

    activityEvents.forEach(eventName => {
      window.removeEventListener(eventName, onActivity)
    })

    listenersBound = false
  }

  const stopSessionMonitor = () => {
    clearTimers()
    hidePrompt()
    detachListeners()
  }

  const scheduleWarning = () => {
    if (!import.meta.client || !isAuthenticated.value) {
      return
    }

    if (showSessionModal.value) {
      return
    }

    if (warningTimer) {
      clearTimeout(warningTimer)
    }

    warningTimer = window.setTimeout(() => {
      showSessionModal.value = true
      countdownSeconds.value = LOGOUT_COUNTDOWN_SECONDS

      if (countdownTimer) {
        clearInterval(countdownTimer)
      }

      countdownTimer = window.setInterval(() => {
        countdownSeconds.value -= 1

        if (countdownSeconds.value > 0) {
          return
        }

        // Automatic logout when countdown reaches zero
        logout().then(() => {
          stopSessionMonitor()
          
          // Clear session storage and navigate to login
          if (import.meta.client) {
            sessionStorage.clear()
            navigateTo('/', { replace: true })
            
            // Reload after a short delay to ensure navigation completes
            setTimeout(() => {
              window.location.reload()
            }, 100)
          }
        })
      }, 1000)
    }, WARNING_AFTER_MS)
  }

  function onActivity() {
    if (!isAuthenticated.value) {
      return
    }

    const now = Date.now()
    if (now - lastTokenRefreshMs.value >= TOKEN_REFRESH_INTERVAL_MS) {
      refreshToken()
      lastTokenRefreshMs.value = now
    }

    scheduleWarning()
  }

  const stayLoggedIn = async () => {
    if (!isAuthenticated.value) {
      await logout()
      stopSessionMonitor()
      
      if (import.meta.client) {
        sessionStorage.clear()
        navigateTo('/', { replace: true })
        
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
      return
    }

    await refreshToken()
    lastTokenRefreshMs.value = Date.now()
    hidePrompt()
    clearTimers()
    scheduleWarning()
  }

  const logoutFromPrompt = async () => {
    await logout()
    stopSessionMonitor()
    
    // Force navigation to login page with reload to ensure clean state
    if (import.meta.client) {
      // Clear any remaining state
      sessionStorage.clear()
      
      // Navigate to login page
      navigateTo('/', { replace: true })
      
      // Force a reload to ensure completely clean state
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }
  }

  const startSessionMonitor = () => {
    if (!import.meta.client) {
      return
    }

    initAuth()

    if (!isAuthenticated.value) {
      stopSessionMonitor()
      return
    }

    if (!listenersBound) {
      activityEvents.forEach(eventName => {
        window.addEventListener(eventName, onActivity, { passive: true })
      })
      listenersBound = true
    }

    scheduleWarning()
  }

  watch(isAuthenticated, (authenticated) => {
    if (authenticated) {
      startSessionMonitor()
      return
    }

    stopSessionMonitor()
  }, { immediate: true })

  onBeforeUnmount(() => {
    stopSessionMonitor()
  })

  return {
    showSessionModal,
    countdownSeconds,
    countdownLabel,
    startSessionMonitor,
    stayLoggedIn,
    logoutFromPrompt
  }
}
