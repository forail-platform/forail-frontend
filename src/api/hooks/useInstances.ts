import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { PaginatedResponse, Instance, InstanceGroup } from '@/api/types'

export interface UseInstancesParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
}

export function useInstances(params: UseInstancesParams = {}) {
  const {
    page = 1,
    page_size = 25,
    order_by = 'hostname',
    search,
  } = params

  return useQuery<PaginatedResponse<Instance>>({
    queryKey: ['instances', { page, page_size, order_by, search }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
        order_by,
      }
      if (search) queryParams.search = search

      const { data } = await api.get<PaginatedResponse<Instance>>(
        '/instances/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useInstanceDetail(id: string) {
  return useQuery<Instance>({
    queryKey: ['instance', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<Instance>(`/instances/${id}/`)
      return data
    },
  })
}

export function useHealthCheckInstance(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.post(`/instances/${id}/health_check/`)
    },
    onSuccess: () => {
      toast.success('Health check started')
      queryClient.invalidateQueries({ queryKey: ['instance', id] })
      queryClient.invalidateQueries({ queryKey: ['instances'] })
    },
  })
}

// --- Topology ---

export function useInstanceTopology() {
  return useQuery<PaginatedResponse<Instance>>({
    queryKey: ['instance-topology'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Instance>>(
        '/instances/',
        { params: { page_size: 200 } },
      )
      return data
    },
  })
}

export function useInstancePeers(id: string) {
  return useQuery<PaginatedResponse<Instance>>({
    queryKey: ['instance-peers', id],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Instance>>(
        `/instances/${id}/peers/`,
      )
      return data
    },
    enabled: !!id,
  })
}

// --- Instance Groups ---

export interface UseInstanceGroupsParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
}

export function useInstanceGroups(params: UseInstanceGroupsParams = {}) {
  const {
    page = 1,
    page_size = 25,
    order_by = 'name',
    search,
  } = params

  return useQuery<PaginatedResponse<InstanceGroup>>({
    queryKey: ['instance_groups', { page, page_size, order_by, search }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
        order_by,
      }
      if (search) queryParams.search = search

      const { data } = await api.get<PaginatedResponse<InstanceGroup>>(
        '/instance_groups/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useInstanceGroupDetail(id: string) {
  return useQuery<InstanceGroup>({
    queryKey: ['instance_group', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<InstanceGroup>(`/instance_groups/${id}/`)
      return data
    },
  })
}
