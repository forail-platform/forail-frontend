import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { PaginatedResponse, JobTemplate, WorkflowJobTemplate } from '@/api/types'

export interface UseTemplatesParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
  type?: 'job_template' | 'workflow_job_template'
}

export function useJobTemplates(params: UseTemplatesParams = {}) {
  const {
    page = 1,
    page_size = 25,
    order_by = '-last_job_run',
    search,
  } = params

  return useQuery<PaginatedResponse<JobTemplate>>({
    queryKey: ['job_templates', { page, page_size, order_by, search }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
        order_by,
      }
      if (search) queryParams.search = search

      const { data } = await api.get<PaginatedResponse<JobTemplate>>(
        '/job_templates/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useWorkflowJobTemplates(params: UseTemplatesParams = {}) {
  const {
    page = 1,
    page_size = 25,
    order_by = '-last_job_run',
    search,
  } = params

  return useQuery<PaginatedResponse<WorkflowJobTemplate>>({
    queryKey: ['workflow_job_templates', { page, page_size, order_by, search }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
        order_by,
      }
      if (search) queryParams.search = search

      const { data } = await api.get<PaginatedResponse<WorkflowJobTemplate>>(
        '/workflow_job_templates/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useJobTemplateDetail(id: string) {
  return useQuery<JobTemplate>({
    queryKey: ['job_template', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<JobTemplate>(`/job_templates/${id}/`)
      return data
    },
  })
}

export function useWorkflowJobTemplateDetail(id: string) {
  return useQuery<WorkflowJobTemplate>({
    queryKey: ['workflow_job_template', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<WorkflowJobTemplate>(
        `/workflow_job_templates/${id}/`,
      )
      return data
    },
  })
}

export function useLaunchJobTemplate(id: string) {
  const queryClient = useQueryClient()

  return useMutation<{ id: number }, Error, Record<string, unknown> | undefined>({
    mutationFn: async (payload) => {
      const { data } = await api.post(`/job_templates/${id}/launch/`, payload ?? {})
      return data
    },
    onSuccess: () => {
      toast.success('Job launched successfully')
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job_template', id] })
      // The dashboard's recent-jobs widget must reflect the new run.
      queryClient.invalidateQueries({ queryKey: ['recent-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteJobTemplate(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/job_templates/${id}/`)
    },
    onSuccess: () => {
      toast.success('Template deleted')
      queryClient.invalidateQueries({ queryKey: ['job_templates'] })
    },
  })
}

export function useCreateJobTemplate() {
  const queryClient = useQueryClient()

  return useMutation<JobTemplate, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post<JobTemplate>('/job_templates/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Template created')
      queryClient.invalidateQueries({ queryKey: ['job_templates'] })
    },
  })
}

export function useUpdateJobTemplate(id: string) {
  const queryClient = useQueryClient()

  return useMutation<JobTemplate, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.patch<JobTemplate>(`/job_templates/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Template updated')
      queryClient.invalidateQueries({ queryKey: ['job_templates'] })
      queryClient.invalidateQueries({ queryKey: ['job_template', id] })
    },
  })
}

export function useProjectPlaybooks(projectId: string | undefined) {
  return useQuery<string[]>({
    queryKey: ['project_playbooks', projectId],
    queryFn: async () => {
      const { data } = await api.get<string[]>(`/projects/${projectId}/playbooks/`)
      return data
    },
    enabled: !!projectId,
  })
}

// --- Survey ---

import type { SurveySpec, DynamicChoicesConfig } from '@/components/survey/SurveyEditor'
export type { SurveySpec, DynamicChoicesConfig }

export function useJobTemplateSurvey(id: string) {
  return useQuery<SurveySpec>({
    queryKey: ['job_template_survey', id],
    queryFn: async () => {
      const { data } = await api.get<SurveySpec>(`/job_templates/${id}/survey_spec/`)
      return data
    },
    enabled: !!id,
  })
}

export function useWorkflowJobTemplateSurvey(id: string) {
  return useQuery<SurveySpec>({
    queryKey: ['workflow_job_template_survey', id],
    queryFn: async () => {
      const { data } = await api.get<SurveySpec>(`/workflow_job_templates/${id}/survey_spec/`)
      return data
    },
    enabled: !!id,
  })
}

export function useSaveJobTemplateSurvey(id: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, SurveySpec>({
    mutationFn: async (spec) => {
      await api.post(`/job_templates/${id}/survey_spec/`, spec)
    },
    onSuccess: () => {
      toast.success('Survey saved')
      queryClient.invalidateQueries({ queryKey: ['job_template_survey', id] })
      queryClient.invalidateQueries({ queryKey: ['job_template', id] })
    },
  })
}

export interface DynamicChoicesResult {
  [variable: string]: {
    choices: string[]
    source_type: string
  }
}

export function useResolveDynamicChoices(id: string) {
  return useMutation<DynamicChoicesResult, Error, string[] | undefined>({
    mutationFn: async (variables) => {
      const payload: Record<string, unknown> = {}
      if (variables) payload.variables = variables
      const { data } = await api.post<DynamicChoicesResult>(
        `/job_templates/${id}/survey_spec/dynamic_choices/`,
        payload,
      )
      return data
    },
  })
}

export function useDeleteJobTemplateSurvey(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/job_templates/${id}/survey_spec/`)
    },
    onSuccess: () => {
      toast.success('Survey deleted')
      queryClient.invalidateQueries({ queryKey: ['job_template_survey', id] })
      queryClient.invalidateQueries({ queryKey: ['job_template', id] })
    },
  })
}

export function useCreateWorkflowJobTemplate() {
  const queryClient = useQueryClient()

  return useMutation<WorkflowJobTemplate, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post<WorkflowJobTemplate>('/workflow_job_templates/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Workflow template created')
      queryClient.invalidateQueries({ queryKey: ['workflow_job_templates'] })
    },
  })
}

export function useUpdateWorkflowJobTemplate(id: string) {
  const queryClient = useQueryClient()

  return useMutation<WorkflowJobTemplate, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.patch<WorkflowJobTemplate>(`/workflow_job_templates/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Workflow template updated')
      queryClient.invalidateQueries({ queryKey: ['workflow_job_templates'] })
      queryClient.invalidateQueries({ queryKey: ['workflow_job_template', id] })
    },
  })
}

export function useDeleteWorkflowJobTemplate(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/workflow_job_templates/${id}/`)
    },
    onSuccess: () => {
      toast.success('Workflow template deleted')
      queryClient.invalidateQueries({ queryKey: ['workflow_job_templates'] })
    },
  })
}

export function useLaunchWorkflowJobTemplate(id: string) {
  const queryClient = useQueryClient()

  return useMutation<{ id: number }, Error, Record<string, unknown> | undefined>({
    mutationFn: async (payload) => {
      const { data } = await api.post(
        `/workflow_job_templates/${id}/launch/`,
        payload ?? {},
      )
      return data
    },
    onSuccess: () => {
      toast.success('Workflow launched successfully')
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['workflow_job_template', id] })
      queryClient.invalidateQueries({ queryKey: ['recent-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
