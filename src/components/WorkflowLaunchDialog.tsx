import { useState, useEffect, useRef } from 'react'
import { Loader2, Rocket, ChevronRight, ChevronLeft } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CodeEditor } from '@/components/CodeEditor'
import { SurveyQuestionInput } from '@/components/SurveyQuestionInput'
import type { WorkflowJobTemplate, WorkflowNodeSurveyInfo, SurveyQuestion } from '@/api/types'
import { api } from '@/api/client'
import { useQuery } from '@tanstack/react-query'
import { useWorkflowJobTemplateSurvey } from '@/api/hooks/useTemplates'

interface WorkflowLaunchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: WorkflowJobTemplate
  isPending: boolean
  onLaunch: (payload: Record<string, unknown>) => void
}

function useWorkflowLaunchData(templateId: string) {
  return useQuery<{
    survey_enabled: boolean
    node_surveys: WorkflowNodeSurveyInfo[]
  }>({
    queryKey: ['workflow_launch_data', templateId],
    queryFn: async () => {
      const { data } = await api.get(`/workflow_job_templates/${templateId}/launch/`)
      return data
    },
    enabled: !!templateId,
  })
}

export function WorkflowLaunchDialog({
  open,
  onOpenChange,
  template,
  isPending,
  onLaunch,
}: WorkflowLaunchDialogProps) {
  const { data: launchData } = useWorkflowLaunchData(String(template.id))
  const { data: wfSurvey } = useWorkflowJobTemplateSurvey(String(template.id))

  const [extraVars, setExtraVars] = useState(template.extra_vars || '---')
  const [step, setStep] = useState(0)

  // Workflow-level survey answers
  const [wfSurveyAnswers, setWfSurveyAnswers] = useState<Record<string, unknown>>({})

  // Node-level survey answers: { [identifier]: { [variable]: value } }
  const [nodeSurveyAnswers, setNodeSurveyAnswers] = useState<Record<string, Record<string, unknown>>>({})

  const wasOpenRef = useRef(false)
  const initRef = useRef(false)

  const nodeSurveys = launchData?.node_surveys ?? []
  const wfSurveyQuestions = (wfSurvey?.spec ?? []) as SurveyQuestion[]
  const hasWfSurvey = Boolean(launchData?.survey_enabled) && wfSurveyQuestions.length > 0
  const totalSteps = (hasWfSurvey ? 1 : 0) + nodeSurveys.length + 1 // +1 for the final extras step

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      initRef.current = false
      return
    }
    // Reset step/extra vars only on the open transition, not on background refetch.
    if (!wasOpenRef.current) {
      wasOpenRef.current = true
      setStep(0)
      setExtraVars(template.extra_vars || '---')
    }
    // Seed survey defaults once, when launch/survey data is first available.
    if (!initRef.current && (launchData || wfSurvey)) {
      initRef.current = true

      const wfDefaults: Record<string, unknown> = {}
      for (const q of wfSurveyQuestions) {
        if (q.default !== '' && q.default !== undefined) wfDefaults[q.variable] = q.default
      }
      setWfSurveyAnswers(wfDefaults)

      const nodeDefaults: Record<string, Record<string, unknown>> = {}
      for (const ns of nodeSurveys) {
        const answers: Record<string, unknown> = {}
        for (const q of ns.survey_spec.spec) {
          if (q.default) answers[q.variable] = q.default
        }
        nodeDefaults[ns.identifier] = answers
      }
      setNodeSurveyAnswers(nodeDefaults)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, launchData, wfSurvey])

  const handleLaunch = () => {
    const payload: Record<string, unknown> = {}

    // Merge workflow survey answers into extra_vars without losing user-entered vars.
    const hasUserVars = template.ask_variables_on_launch && extraVars && extraVars !== '---'
    if (Object.keys(wfSurveyAnswers).length > 0) {
      if (hasUserVars) {
        try {
          const ev = JSON.parse(extraVars) as Record<string, unknown>
          payload.extra_vars = JSON.stringify({ ...ev, ...wfSurveyAnswers })
        } catch {
          // extraVars is YAML — append survey answers as YAML lines (JSON ⊂ YAML).
          const surveyYaml = Object.entries(wfSurveyAnswers)
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join('\n')
          payload.extra_vars = `${extraVars}\n${surveyYaml}`
        }
      } else {
        payload.extra_vars = JSON.stringify(wfSurveyAnswers)
      }
    } else if (hasUserVars) {
      payload.extra_vars = extraVars
    }

    if (Object.keys(nodeSurveyAnswers).length > 0) {
      payload.node_survey_data = nodeSurveyAnswers
    }

    onLaunch(payload)
  }

  // Determine what step shows what
  const getStepContent = () => {
    let currentStep = 0

    // Workflow-level survey
    if (hasWfSurvey) {
      if (step === currentStep) {
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Workflow Survey</h3>
              <Badge variant="outline">Workflow Level</Badge>
            </div>
            {wfSurveyQuestions.map((q) => (
              <div key={q.variable} className="space-y-2">
                <Label>
                  {q.question_name}
                  {q.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {q.question_description && (
                  <p className="text-xs text-muted-foreground">{q.question_description}</p>
                )}
                <SurveyQuestionInput
                  question={q}
                  value={wfSurveyAnswers[q.variable]}
                  onChange={(val) => setWfSurveyAnswers(prev => ({ ...prev, [q.variable]: val }))}
                />
              </div>
            ))}
          </div>
        )
      }
      currentStep++
    }

    // Node surveys
    for (let i = 0; i < nodeSurveys.length; i++) {
      if (step === currentStep) {
        const ns = nodeSurveys[i]!
        const answers = nodeSurveyAnswers[ns.identifier] ?? {}
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{ns.node_name || 'Node Survey'}</h3>
              <Badge variant="outline">Node: {ns.identifier.slice(0, 8)}</Badge>
            </div>
            {ns.survey_spec.spec.map((q) => (
              <div key={q.variable} className="space-y-2">
                <Label>
                  {q.question_name}
                  {q.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {q.question_description && (
                  <p className="text-xs text-muted-foreground">{q.question_description}</p>
                )}
                <SurveyQuestionInput
                  question={q as unknown as import('@/api/types').SurveyQuestion}
                  value={answers[q.variable]}
                  onChange={(val) => {
                    setNodeSurveyAnswers(prev => ({
                      ...prev,
                      [ns.identifier]: { ...(prev[ns.identifier] ?? {}), [q.variable]: val },
                    }))
                  }}
                />
              </div>
            ))}
          </div>
        )
      }
      currentStep++
    }

    // Extra vars step (always last)
    return (
      <div className="space-y-4">
        <h3 className="font-semibold">Extra Variables</h3>
        {template.ask_variables_on_launch && (
          <CodeEditor
            value={extraVars}
            onChange={setExtraVars}
            language="yaml"
            height="200px"
          />
        )}
        {!template.ask_variables_on_launch && (
          <p className="text-sm text-muted-foreground">
            No additional variables required. Ready to launch.
          </p>
        )}
      </div>
    )
  }

  const isLastStep = step === totalSteps - 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Launch: {template.name}</DialogTitle>
          {totalSteps > 1 && (
            <p className="text-xs text-muted-foreground">
              Step {step + 1} of {totalSteps}
            </p>
          )}
        </DialogHeader>

        {getStepContent()}

        <DialogFooter className="gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          )}
          {!isLastStep ? (
            <Button onClick={() => setStep(s => s + 1)}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleLaunch} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="mr-1 h-4 w-4" />
              )}
              Launch
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
