import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { PaginatedResponse, Schedule, SchedulePreviewResponse, ScheduleZoneInfoResponse } from '@/api/types'

export interface UseSchedulesParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
}

export function useSchedules(params: UseSchedulesParams = {}) {
  const {
    page = 1,
    page_size = 25,
    order_by = '-next_run',
    search,
  } = params

  return useQuery<PaginatedResponse<Schedule>>({
    queryKey: ['schedules', { page, page_size, order_by, search }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
        order_by,
      }
      if (search) queryParams.search = search

      const { data } = await api.get<PaginatedResponse<Schedule>>(
        '/schedules/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useResourceSchedules(resourceType: string, resourceId: string) {
  return useQuery<PaginatedResponse<Schedule>>({
    queryKey: ['resource_schedules', resourceType, resourceId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Schedule>>(
        `/${resourceType}/${resourceId}/schedules/`,
        { params: { page_size: 50, order_by: '-next_run' } },
      )
      return data
    },
    enabled: !!resourceId,
  })
}

export function useScheduleDetail(id: string) {
  return useQuery<Schedule>({
    queryKey: ['schedule', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<Schedule>(`/schedules/${id}/`)
      return data
    },
  })
}

export function useCreateSchedule() {
  const queryClient = useQueryClient()

  return useMutation<Schedule, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post<Schedule>('/schedules/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Schedule created')
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

export function useUpdateSchedule(id: string) {
  const queryClient = useQueryClient()

  return useMutation<Schedule, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.patch<Schedule>(`/schedules/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Schedule updated')
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      queryClient.invalidateQueries({ queryKey: ['schedule', id] })
    },
  })
}

export function useDeleteSchedule(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/schedules/${id}/`)
    },
    onSuccess: () => {
      toast.success('Schedule deleted')
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

export function useSchedulePreview(rrule: string) {
  return useQuery<SchedulePreviewResponse>({
    queryKey: ['schedule-preview', rrule],
    queryFn: async () => {
      const { data } = await api.post<SchedulePreviewResponse>(
        '/schedules/preview/',
        { rrule },
      )
      return data
    },
    enabled: rrule.includes('RRULE'),
  })
}

export function useScheduleZoneInfo() {
  return useQuery<ScheduleZoneInfoResponse>({
    queryKey: ['schedule-zoneinfo'],
    queryFn: async () => {
      const { data } = await api.get<ScheduleZoneInfoResponse>(
        '/schedules/zoneinfo/',
      )
      return data
    },
    staleTime: Infinity,
  })
}
