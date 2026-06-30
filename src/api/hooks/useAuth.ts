import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { MeResponse, User } from '@/api/types'
import { useAuthStore } from '@/stores/auth'

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser)

  return useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get<MeResponse>('/me/')
      const user = data.results[0]
      // An empty result set means "not authenticated" — surface it as an error so
      // App treats it like a 401 (redirect to login) instead of resolving the
      // query successfully with an undefined user that consumers then deref.
      if (!user) throw new Error('Not authenticated')
      setUser(user)
      return user
    },
    retry: false,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      // GET /api/login/ sets the csrftoken cookie
      await api.get('/login/', { baseURL: '/api' })
      // POST form-urlencoded credentials (Forail requires this format)
      const formData = new URLSearchParams()
      formData.append('username', credentials.username)
      formData.append('password', credentials.password)
      await api.post('/login/', formData.toString(), {
        baseURL: '/api',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        maxRedirects: 0,
        validateStatus: (status) => status < 400,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const clearUser = useAuthStore((s) => s.clearUser)

  return useMutation({
    mutationFn: async () => {
      await api.post('/logout/', null, { baseURL: '/api' })
    },
    onSuccess: () => {
      clearUser()
      queryClient.clear()
      window.location.href = '/login'
    },
  })
}
