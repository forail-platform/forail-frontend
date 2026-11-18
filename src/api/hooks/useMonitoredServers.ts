import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { EnrollmentCode, MonitoredServer, PaginatedResponse } from '@/api/types'

export interface UseMonitoredServersParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
}

export function useMonitoredServers(params: UseMonitoredServersParams = {}) {
  const { page = 1, page_size = 25, order_by = 'name', search } = params

  return useQuery<PaginatedResponse<MonitoredServer>>({
    queryKey: ['monitored_servers', { page, page_size, order_by, search }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, page_size, order_by }
      if (search) queryParams.search = search
      const { data } = await api.get<PaginatedResponse<MonitoredServer>>('/monitored_servers/', { params: queryParams })
      return data
    },
    placeholderData: keepPreviousData,
    // Online state comes from the agents; keep it reasonably fresh.
    refetchInterval: 30_000,
  })
}

export function useMonitoredServer(id: string | undefined) {
  return useQuery<MonitoredServer>({
    queryKey: ['monitored_server', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<MonitoredServer>(`/monitored_servers/${id}/`)
      return data
    },
    refetchInterval: 15_000,
  })
}

export interface CreateMonitoredServerPayload {
  name: string
  organization: number
  description?: string
}

export function useCreateMonitoredServer() {
  const queryClient = useQueryClient()
  return useMutation<MonitoredServer, Error, CreateMonitoredServerPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<MonitoredServer>('/monitored_servers/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Monitored server registered')
      queryClient.invalidateQueries({ queryKey: ['monitored_servers'] })
    },
  })
}

export function useUpdateMonitoredServer(id: string) {
  const queryClient = useQueryClient()
  return useMutation<MonitoredServer, Error, { description: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.patch<MonitoredServer>(`/monitored_servers/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Monitored server updated')
      queryClient.invalidateQueries({ queryKey: ['monitored_servers'] })
      queryClient.invalidateQueries({ queryKey: ['monitored_server', id] })
    },
  })
}

export function useDeleteMonitoredServer(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/monitored_servers/${id}/`)
    },
    onSuccess: () => {
      toast.success('Monitored server deleted')
      queryClient.invalidateQueries({ queryKey: ['monitored_servers'] })
    },
  })
}

/** A one-time code (10 minutes, single use) and the install command that uses it. */
export function useIssueEnrollmentCode(id: string) {
  return useMutation<EnrollmentCode, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post<EnrollmentCode>(`/monitored_servers/${id}/enrollment_code/`)
      return data
    },
  })
}

/** Revokes the agent's token at once; the host re-enrolls with the code returned. */
export function useRotateAgentToken(id: string) {
  const queryClient = useQueryClient()
  return useMutation<EnrollmentCode, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post<EnrollmentCode>(`/monitored_servers/${id}/rotate_token/`)
      return data
    },
    onSuccess: () => {
      toast.success('Agent token revoked. Re-enroll the agent with the new code.')
      queryClient.invalidateQueries({ queryKey: ['monitored_server', id] })
    },
  })
}
