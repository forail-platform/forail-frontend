import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { PaginatedResponse, Project } from '@/api/types'

export interface UseProjectsParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
}

export function useProjects(params: UseProjectsParams = {}) {
  const {
    page = 1,
    page_size = 25,
    order_by = 'name',
    search,
  } = params

  return useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects', { page, page_size, order_by, search }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
        order_by,
      }
      if (search) queryParams.search = search

      const { data } = await api.get<PaginatedResponse<Project>>(
        '/projects/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useProjectDetail(id: string) {
  return useQuery<Project>({
    queryKey: ['project', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<Project>(`/projects/${id}/`)
      return data
    },
  })
}

export function useDeleteProject(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/projects/${id}/`)
    },
    onSuccess: () => {
      toast.success('Project deleted')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation<Project, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post<Project>('/projects/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Project created')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient()

  return useMutation<Project, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.patch<Project>(`/projects/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Project updated')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
    },
  })
}

export function useSyncProject(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/projects/${id}/update/`)
      return data
    },
    onSuccess: () => {
      toast.success('Project sync started')
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
