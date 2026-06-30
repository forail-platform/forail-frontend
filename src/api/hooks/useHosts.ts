import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { PaginatedResponse, Host } from '@/api/types'

export interface UseHostsParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
}

export function useHosts(params: UseHostsParams = {}) {
  const {
    page = 1,
    page_size = 25,
    order_by = 'name',
    search,
  } = params

  return useQuery<PaginatedResponse<Host>>({
    queryKey: ['hosts', { page, page_size, order_by, search }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
        order_by,
      }
      if (search) queryParams.search = search

      const { data } = await api.get<PaginatedResponse<Host>>(
        '/hosts/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useHostDetail(id: string) {
  return useQuery<Host>({
    queryKey: ['host', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<Host>(`/hosts/${id}/`)
      return data
    },
  })
}

export function useToggleHost(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data } = await api.patch<Host>(`/hosts/${id}/`, { enabled })
      return data
    },
    onSuccess: (_data, enabled) => {
      toast.success(enabled ? 'Host enabled' : 'Host disabled')
      queryClient.invalidateQueries({ queryKey: ['host', id] })
      queryClient.invalidateQueries({ queryKey: ['hosts'] })
    },
  })
}
