// composables/useApi.ts
// Thin client-side wrapper that calls /api/* (Nuxt server routes).
// Automatically attaches the current auth token. Never calls PostgREST directly.

export const useApi = () => {
  const token = useState<string | null>('auth-token')

  const authHeaders = computed((): Record<string, string> =>
    token.value ? { Authorization: `Bearer ${token.value}` } : {}
  )

  const get = <T>(path: string, query?: Record<string, string>) =>
    $fetch<T>(path, { method: 'GET', headers: authHeaders.value, query })

  const post = <T>(path: string, body?: unknown) =>
    $fetch<T>(path, { method: 'POST', headers: authHeaders.value, body })

  const patch = <T>(path: string, body: unknown, query?: Record<string, string>) =>
    $fetch<T>(path, { method: 'PATCH', headers: authHeaders.value, body, query })

  const put = <T>(path: string, body: unknown) =>
    $fetch<T>(path, { method: 'PUT', headers: authHeaders.value, body })

  const del = <T>(path: string, query?: Record<string, string>) =>
    $fetch<T>(path, { method: 'DELETE', headers: authHeaders.value, query })

  return { get, post, patch, put, del }
}
