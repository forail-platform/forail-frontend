import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type {
  PaginatedResponse,
  Policy,
  PolicyDecision,
  PolicyDecisionKind,
  PolicyTestResponse,
} from '@/api/types'

// ---------------------------------------------------------------------------
// Policies CRUD
// ---------------------------------------------------------------------------

export interface UsePoliciesParams {
  page?: number
  page_size?: number
  enabled?: string
  organization?: string | number
  applies_to?: string
  search?: string
}

export function usePolicies(params: UsePoliciesParams = {}) {
  const { page = 1, page_size = 25, ...filters } = params
  return useQuery<PaginatedResponse<Policy>>({
    queryKey: ['policies', { page, page_size, ...filters }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, page_size }
      for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== '') queryParams[k] = v as string
      const { data } = await api.get<PaginatedResponse<Policy>>('/policies/', { params: queryParams })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function usePolicy(id: string | number | undefined) {
  return useQuery<Policy>({
    queryKey: ['policy', id],
    queryFn: async () => {
      const { data } = await api.get<Policy>(`/policies/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreatePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Policy>) => {
      const { data } = await api.post<Policy>('/policies/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Policy created')
      qc.invalidateQueries({ queryKey: ['policies'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e.response?.data?.detail || 'Failed to create policy')
    },
  })
}

export function useUpdatePolicy(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Policy>) => {
      const { data } = await api.patch<Policy>(`/policies/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Policy updated')
      qc.invalidateQueries({ queryKey: ['policies'] })
      qc.invalidateQueries({ queryKey: ['policy', id] })
    },
    onError: () => toast.error('Failed to update policy'),
  })
}

export function useDeletePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string | number) => {
      await api.delete(`/policies/${id}/`)
    },
    onSuccess: () => {
      toast.success('Policy deleted')
      qc.invalidateQueries({ queryKey: ['policies'] })
    },
    onError: () => toast.error('Failed to delete policy'),
  })
}

export function useTogglePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const action = enabled ? 'enable' : 'disable'
      const { data } = await api.post(`/policies/${id}/${action}/`)
      return data
    },
    onSuccess: (_data, { enabled }) => {
      toast.success(enabled ? 'Policy enabled' : 'Policy disabled')
      qc.invalidateQueries({ queryKey: ['policies'] })
    },
  })
}

export function useTestPolicy(id: string | number) {
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await api.post<PolicyTestResponse>(`/policies/${id}/test/`, { input })
      return data
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string; detail?: string } } }
      toast.error(e.response?.data?.error || e.response?.data?.detail || 'Test failed')
    },
  })
}

// ---------------------------------------------------------------------------
// Policy Decisions
// ---------------------------------------------------------------------------

export interface UsePolicyDecisionsParams {
  page?: number
  page_size?: number
  decision?: PolicyDecisionKind
  policy?: number
  unified_job?: number
  since?: string
}

export function usePolicyDecisions(params: UsePolicyDecisionsParams = {}) {
  const { page = 1, page_size = 25, ...filters } = params
  return useQuery<PaginatedResponse<PolicyDecision>>({
    queryKey: ['policy_decisions', { page, page_size, ...filters }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, page_size }
      for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== '') queryParams[k] = v as string | number
      const { data } = await api.get<PaginatedResponse<PolicyDecision>>('/policy_decisions/', { params: queryParams })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function usePolicyDecision(id: string | number | undefined) {
  return useQuery<PolicyDecision>({
    queryKey: ['policy_decision', id],
    queryFn: async () => {
      const { data } = await api.get<PolicyDecision>(`/policy_decisions/${id}/`)
      return data
    },
    enabled: !!id,
  })
}
