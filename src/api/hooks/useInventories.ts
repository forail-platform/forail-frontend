import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { PaginatedResponse, Inventory, Host, Group, InventorySource } from '@/api/types'

export interface UseInventoriesParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
}

export function useInventories(params: UseInventoriesParams = {}) {
  const {
    page = 1,
    page_size = 25,
    order_by = 'name',
    search,
  } = params

  return useQuery<PaginatedResponse<Inventory>>({
    queryKey: ['inventories', { page, page_size, order_by, search }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
        order_by,
      }
      if (search) queryParams.search = search

      const { data } = await api.get<PaginatedResponse<Inventory>>(
        '/inventories/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useInventoryDetail(id: string) {
  return useQuery<Inventory>({
    queryKey: ['inventory', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<Inventory>(`/inventories/${id}/`)
      return data
    },
  })
}

export interface UseInventoryHostsParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
}

export function useInventoryHosts(inventoryId: string, params: UseInventoryHostsParams = {}) {
  const {
    page = 1,
    page_size = 25,
    order_by = 'name',
    search,
  } = params

  return useQuery<PaginatedResponse<Host>>({
    queryKey: ['inventory_hosts', inventoryId, { page, page_size, order_by, search }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
        order_by,
      }
      if (search) queryParams.search = search

      const { data } = await api.get<PaginatedResponse<Host>>(
        `/inventories/${inventoryId}/hosts/`,
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useInventoryGroups(inventoryId: string, params: UseInventoryHostsParams = {}) {
  const {
    page = 1,
    page_size = 25,
    order_by = 'name',
    search,
  } = params

  return useQuery<PaginatedResponse<Group>>({
    queryKey: ['inventory_groups', inventoryId, { page, page_size, order_by, search }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
        order_by,
      }
      if (search) queryParams.search = search

      const { data } = await api.get<PaginatedResponse<Group>>(
        `/inventories/${inventoryId}/groups/`,
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useCreateInventory() {
  const queryClient = useQueryClient()

  return useMutation<Inventory, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post<Inventory>('/inventories/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Inventory created')
      queryClient.invalidateQueries({ queryKey: ['inventories'] })
    },
  })
}

export function useUpdateInventory(id: string) {
  const queryClient = useQueryClient()

  return useMutation<Inventory, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.patch<Inventory>(`/inventories/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Inventory updated')
      queryClient.invalidateQueries({ queryKey: ['inventories'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', id] })
    },
  })
}

export function useDeleteInventory(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/inventories/${id}/`)
    },
    onSuccess: () => {
      toast.success('Inventory deleted')
      queryClient.invalidateQueries({ queryKey: ['inventories'] })
    },
  })
}

export function useInventorySources(inventoryId: string) {
  return useQuery<PaginatedResponse<InventorySource>>({
    queryKey: ['inventory_sources', inventoryId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<InventorySource>>(
        `/inventories/${inventoryId}/inventory_sources/`,
      )
      return data
    },
  })
}

export function useSyncInventorySource(sourceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.post(`/inventory_sources/${sourceId}/update/`)
    },
    onSuccess: () => {
      toast.success('Inventory source sync started')
      queryClient.invalidateQueries({ queryKey: ['inventory_sources'] })
    },
  })
}
