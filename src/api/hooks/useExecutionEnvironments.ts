import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { PaginatedResponse, ExecutionEnvironment } from '@/api/types'

export interface UseExecutionEnvironmentsParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
}

export function useExecutionEnvironments(params: UseExecutionEnvironmentsParams = {}) {
  const {
    page = 1,
    page_size = 25,
    order_by = 'name',
    search,
  } = params

  return useQuery<PaginatedResponse<ExecutionEnvironment>>({
    queryKey: ['execution_environments', { page, page_size, order_by, search }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
        order_by,
      }
      if (search) queryParams.search = search

      const { data } = await api.get<PaginatedResponse<ExecutionEnvironment>>(
        '/execution_environments/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useExecutionEnvironmentDetail(id: string) {
  return useQuery<ExecutionEnvironment>({
    queryKey: ['execution_environment', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ExecutionEnvironment>(
        `/execution_environments/${id}/`,
      )
      return data
    },
  })
}
