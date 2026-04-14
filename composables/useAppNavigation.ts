interface BackOptions {
  adminFallback?: string
  userFallback?: string
}

export const useAppNavigation = () => {
  const router = useRouter()
  const { currentUser, isAdmin } = useAuth()

  const goBack = (options?: BackOptions) => {
    const adminFallback = options?.adminFallback || '/dashboard'
    const userFallback = options?.userFallback || '/'

    if (import.meta.client && window.history.length > 1) {
      router.back()
      return
    }

    if (currentUser.value && isAdmin.value) {
      navigateTo(adminFallback)
      return
    }

    navigateTo(userFallback)
  }

  return {
    goBack
  }
}
