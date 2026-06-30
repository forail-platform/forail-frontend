import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { PaginatedResponse, Credential, CredentialType } from '@/api/types'

export interface UseCredentialsParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
  credential_type?: number
}

export function useCredentials(params: UseCredentialsParams = {}) {
  const {
    page = 1,
    page_size = 25,
    order_by = 'name',
    search,
    credential_type,
  } = params

  return useQuery<PaginatedResponse<Credential>>({
    queryKey: ['credentials', { page, page_size, order_by, search, credential_type }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
        order_by,
      }
      if (search) queryParams.search = search
      if (credential_type) queryParams.credential_type = credential_type

      const { data } = await api.get<PaginatedResponse<Credential>>(
        '/credentials/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useCredentialDetail(id: string) {
  return useQuery<Credential>({
    queryKey: ['credential', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<Credential>(`/credentials/${id}/`)
      return data
    },
  })
}

export function useCreateCredential() {
  const queryClient = useQueryClient()

  return useMutation<Credential, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post<Credential>('/credentials/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Credential created')
      queryClient.invalidateQueries({ queryKey: ['credentials'] })
    },
  })
}

export function useUpdateCredential(id: string) {
  const queryClient = useQueryClient()

  return useMutation<Credential, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.patch<Credential>(`/credentials/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Credential updated')
      queryClient.invalidateQueries({ queryKey: ['credentials'] })
      queryClient.invalidateQueries({ queryKey: ['credential', id] })
    },
  })
}

export function useDeleteCredential(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/credentials/${id}/`)
    },
    onSuccess: () => {
      toast.success('Credential deleted')
      queryClient.invalidateQueries({ queryKey: ['credentials'] })
    },
  })
}

export function useCredentialTypes() {
  return useQuery<PaginatedResponse<CredentialType>>({
    queryKey: ['credential_types'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<CredentialType>>(
        '/credential_types/',
        { params: { page_size: 200, order_by: 'name' } },
      )
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}
