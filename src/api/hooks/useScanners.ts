import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type {
  PaginatedResponse,
  Scanner,
  ScanResult,
  ScanStatus,
} from '@/api/types'

// ---------------------------------------------------------------------------
// Scanners CRUD
// ---------------------------------------------------------------------------

export interface UseScannersParams {
  page?: number
  page_size?: number
  enabled?: string
  organization?: string | number
  tool?: string
  search?: string
}

export function useScanners(params: UseScannersParams = {}) {
  const { page = 1, page_size = 25, ...filters } = params
  return useQuery<PaginatedResponse<Scanner>>({
    queryKey: ['scanners', { page, page_size, ...filters }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, page_size }
      for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== '') queryParams[k] = v as string
      const { data } = await api.get<PaginatedResponse<Scanner>>('/scanners/', { params: queryParams })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useScanner(id: string | number | undefined) {
  return useQuery<Scanner>({
    queryKey: ['scanner', id],
    queryFn: async () => {
      const { data } = await api.get<Scanner>(`/scanners/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateScanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Scanner>) => {
      const { data } = await api.post<Scanner>('/scanners/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Scanner created')
      qc.invalidateQueries({ queryKey: ['scanners'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e.response?.data?.detail || 'Failed to create scanner')
    },
  })
}

export function useUpdateScanner(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Scanner>) => {
      const { data } = await api.patch<Scanner>(`/scanners/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Scanner updated')
      qc.invalidateQueries({ queryKey: ['scanners'] })
      qc.invalidateQueries({ queryKey: ['scanner', id] })
    },
    onError: () => toast.error('Failed to update scanner'),
  })
}

export function useDeleteScanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string | number) => {
      await api.delete(`/scanners/${id}/`)
    },
    onSuccess: () => {
      toast.success('Scanner deleted')
      qc.invalidateQueries({ queryKey: ['scanners'] })
    },
    onError: () => toast.error('Failed to delete scanner'),
  })
}

export function useToggleScanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const action = enabled ? 'enable' : 'disable'
      const { data } = await api.post(`/scanners/${id}/${action}/`)
      return data
    },
    onSuccess: (_data, { enabled }) => {
      toast.success(enabled ? 'Scanner enabled' : 'Scanner disabled')
      qc.invalidateQueries({ queryKey: ['scanners'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Scan Results
// ---------------------------------------------------------------------------

export interface UseScanResultsParams {
  page?: number
  page_size?: number
  status?: ScanStatus | ''
  scanner?: number | string
  unified_job?: number | string
  since?: string
}

export function useScanResults(params: UseScanResultsParams = {}) {
  const { page = 1, page_size = 25, ...filters } = params
  return useQuery<PaginatedResponse<ScanResult>>({
    queryKey: ['scan_results', { page, page_size, ...filters }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, page_size }
      for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== '') queryParams[k] = v as string | number
      const { data } = await api.get<PaginatedResponse<ScanResult>>('/scan_results/', { params: queryParams })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useScanResult(id: string | number | undefined) {
  return useQuery<ScanResult>({
    queryKey: ['scan_result', id],
    queryFn: async () => {
      const { data } = await api.get<ScanResult>(`/scan_results/${id}/`)
      return data
    },
    enabled: !!id,
  })
}
