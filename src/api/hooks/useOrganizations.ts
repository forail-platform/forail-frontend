import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { PaginatedResponse, Organization } from '@/api/types'

export interface UseOrganizationsParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
}

export function useOrganizations(params: UseOrganizationsParams = {}) {
  const {
    page = 1,
    page_size = 25,
    order_by = 'name',
    search,
  } = params

  return useQuery<PaginatedResponse<Organization>>({
    queryKey: ['organizations', { page, page_size, order_by, search }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
        order_by,
      }
      if (search) queryParams.search = search

      const { data } = await api.get<PaginatedResponse<Organization>>(
        '/organizations/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()

  return useMutation<Organization, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post<Organization>('/organizations/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Organization created')
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })
}

export function useUpdateOrganization(id: string) {
  const queryClient = useQueryClient()

  return useMutation<Organization, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.patch<Organization>(`/organizations/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Organization updated')
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['organization', id] })
    },
  })
}

export function useDeleteOrganization(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/organizations/${id}/`)
    },
    onSuccess: () => {
      toast.success('Organization deleted')
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })
}

export function useOrganizationDetail(id: string) {
  return useQuery<Organization>({
    queryKey: ['organization', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<Organization>(`/organizations/${id}/`)
      return data
    },
  })
}
