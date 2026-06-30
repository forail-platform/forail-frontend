import { useState, useEffect, useRef } from 'react'
import { Loader2, Rocket, RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { CodeEditor } from '@/components/CodeEditor'
import type { JobTemplate } from '@/api/types'
import type { SurveyQuestion } from '@/components/survey/SurveyEditor'
import { useJobTemplateSurvey, useResolveDynamicChoices } from '@/api/hooks/useTemplates'

const verbosityOptions = [
  { value: '0', label: '0 (Normal)' },
  { value: '1', label: '1 (Verbose)' },
  { value: '2', label: '2 (More Verbose)' },
  { value: '3', label: '3 (Debug)' },
  { value: '4', label: '4 (Connection Debug)' },
  { value: '5', label: '5 (WinRM Debug)' },
]

const jobTypeOptions = [
  { value: 'run', label: 'Run' },
  { value: 'check', label: 'Check' },
]

interface LaunchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: JobTemplate
  isPending: boolean
  onLaunch: (payload: Record<string, unknown>) => void
}

export function LaunchDialog({
  open,
  onOpenChange,
  template,
  isPending,
  onLaunch,
}: LaunchDialogProps) {
  const [limit, setLimit] = useState(template.limit ?? '')
  const [jobTags, setJobTags] = useState(template.job_tags ?? '')
  const [skipTags, setSkipTags] = useState(template.skip_tags ?? '')
  const [verbosity, setVerbosity] = useState(String(template.verbosity ?? 0))
  const [jobType, setJobType] = useState('run')
  const [extraVars, setExtraVars] = useState(template.extra_vars || '---')
  const [forks, setForks] = useState(String(template.forks ?? 0))
  const [jobSliceCount, setJobSliceCount] = useState(String(template.job_slice_count ?? 1))

  // Survey state
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, unknown>>({})
  const [dynamicChoices, setDynamicChoices] = useState<Record<string, string[]>>({})

  const { data: surveyData } = useJobTemplateSurvey(String(template.id))
  const resolveDynamic = useResolveDynamicChoices(String(template.id))

  const hasSurvey = template.survey_enabled && surveyData?.spec?.length

  const wasOpenRef = useRef(false)
  const surveyInitRef = useRef(false)

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      surveyInitRef.current = false
      return
    }

    // Reset scalar fields only on the open transition, not on every background
    // refetch of template/surveyData (which would wipe what the user has typed).
    if (!wasOpenRef.current) {
      wasOpenRef.current = true
      setLimit(template.limit ?? '')
      setJobTags(template.job_tags ?? '')
      setSkipTags(template.skip_tags ?? '')
      setVerbosity(String(template.verbosity ?? 0))
      setExtraVars(template.extra_vars || '---')
      setForks(String(template.forks ?? 0))
      setJobSliceCount(String(template.job_slice_count ?? 1))
    }

    // Seed survey answers once per open, when the spec first becomes available.
    if (surveyData?.spec && !surveyInitRef.current) {
      surveyInitRef.current = true
      const defaults: Record<string, unknown> = {}
      for (const q of surveyData.spec) {
        if (q.default !== '' && q.default !== undefined) {
          if (q.type === 'integer') defaults[q.variable] = Number(q.default)
          else if (q.type === 'float') defaults[q.variable] = Number(q.default)
          else if (q.type === 'multiselect' && typeof q.default === 'string') {
            defaults[q.variable] = q.default.split('\n').filter(Boolean)
          } else {
            defaults[q.variable] = q.default
          }
        }
      }
      setSurveyAnswers(defaults)

      // Resolve dynamic choices
      const dynamicVars = surveyData.spec
        .filter(q => q.dynamic_choices?.enabled)
        .map(q => q.variable)
      if (dynamicVars.length > 0) {
        resolveDynamic.mutate(dynamicVars, {
          onSuccess: (data) => {
            const resolved: Record<string, string[]> = {}
            for (const [variable, info] of Object.entries(data)) {
              resolved[variable] = info.choices
            }
            setDynamicChoices(resolved)
          },
        })
      } else {
        setDynamicChoices({})
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template, surveyData])

  const hasPrompts =
    template.ask_limit_on_launch ||
    template.ask_tags_on_launch ||
    template.ask_skip_tags_on_launch ||
    template.ask_verbosity_on_launch ||
    template.ask_job_type_on_launch ||
    template.ask_variables_on_launch ||
    template.ask_forks_on_launch ||
    template.ask_job_slice_count_on_launch

  const handleLaunch = () => {
    const payload: Record<string, unknown> = {}
    if (template.ask_limit_on_launch && limit) payload.limit = limit
    if (template.ask_tags_on_launch && jobTags) payload.job_tags = jobTags
    if (template.ask_skip_tags_on_launch && skipTags) payload.skip_tags = skipTags
    if (template.ask_verbosity_on_launch) payload.verbosity = Number(verbosity)
    if (template.ask_job_type_on_launch) payload.job_type = jobType
    if (template.ask_forks_on_launch) payload.forks = Number(forks)
    if (template.ask_job_slice_count_on_launch) payload.job_slice_count = Number(jobSliceCount)

    // Merge survey answers into extra_vars without losing user-entered vars.
    const hasUserVars = template.ask_variables_on_launch && extraVars && extraVars !== '---'
    if (hasSurvey && Object.keys(surveyAnswers).length > 0) {
      if (hasUserVars) {
        try {
          const ev = JSON.parse(extraVars) as Record<string, unknown>
          payload.extra_vars = JSON.stringify({ ...ev, ...surveyAnswers })
        } catch {
          // extraVars is YAML — JSON is a valid YAML subset, so append the survey
          // answers as YAML lines instead of discarding the user's vars.
          const surveyYaml = Object.entries(surveyAnswers)
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join('\n')
          payload.extra_vars = `${extraVars}\n${surveyYaml}`
        }
      } else {
        payload.extra_vars = JSON.stringify(surveyAnswers)
      }
    } else if (hasUserVars) {
      payload.extra_vars = extraVars
    }

    onLaunch(payload)
  }

  const updateAnswer = (variable: string, value: unknown) => {
    setSurveyAnswers(prev => ({ ...prev, [variable]: value }))
  }

  const getChoicesForQuestion = (q: SurveyQuestion): string[] => {
    // Dynamic choices take priority
    if (q.dynamic_choices?.enabled && dynamicChoices[q.variable]) {
      return dynamicChoices[q.variable]!
    }
    // Fall back to static choices
    if (q.choices) {
      return q.choices.split('\n').filter(c => c.trim() !== '')
    }
    return []
  }

  const renderSurveyQuestion = (q: SurveyQuestion) => {
    const value = surveyAnswers[q.variable]
    const isDynamic = q.dynamic_choices?.enabled
    const isLoadingDynamic = isDynamic && resolveDynamic.isPending

    switch (q.type) {
      case 'text':
        return (
          <Input
            value={String(value ?? '')}
            onChange={e => updateAnswer(q.variable, e.target.value)}
            placeholder={q.question_description || undefined}
          />
        )
      case 'textarea':
        return (
          <Textarea
            value={String(value ?? '')}
            onChange={e => updateAnswer(q.variable, e.target.value)}
            rows={3}
            placeholder={q.question_description || undefined}
          />
        )
      case 'password':
        return (
          <Input
            type="password"
            value={String(value ?? '')}
            onChange={e => updateAnswer(q.variable, e.target.value)}
          />
        )
      case 'integer':
        return (
          <Input
            type="number"
            value={value !== undefined ? String(value) : ''}
            onChange={e => updateAnswer(q.variable, e.target.value ? Number(e.target.value) : '')}
            min={q.min ?? undefined}
            max={q.max ?? undefined}
          />
        )
      case 'float':
        return (
          <Input
            type="number"
            step="any"
            value={value !== undefined ? String(value) : ''}
            onChange={e => updateAnswer(q.variable, e.target.value ? Number(e.target.value) : '')}
            min={q.min ?? undefined}
            max={q.max ?? undefined}
          />
        )
      case 'multiplechoice': {
        const choices = getChoicesForQuestion(q)
        if (isLoadingDynamic) {
          return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading choices...
            </div>
          )
        }
        return (
          <div className="flex items-center gap-2">
            <Select
              value={String(value ?? '')}
              onChange={e => updateAnswer(q.variable, e.target.value)}
              options={[
                { value: '', label: '-- Select --' },
                ...choices.map(c => ({ value: c, label: c })),
              ]}
            />
            {isDynamic && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  resolveDynamic.mutate([q.variable], {
                    onSuccess: (data) => {
                      if (data[q.variable]) {
                        setDynamicChoices(prev => ({
                          ...prev,
                          [q.variable]: data[q.variable]!.choices,
                        }))
                      }
                    },
                  })
                }}
                title="Refresh choices"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${resolveDynamic.isPending ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        )
      }
      case 'multiselect': {
        const choices = getChoicesForQuestion(q)
        const selected = Array.isArray(value) ? value as string[] : []
        if (isLoadingDynamic) {
          return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading choices...
            </div>
          )
        }
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">{selected.length} selected</span>
              {isDynamic && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    resolveDynamic.mutate([q.variable], {
                      onSuccess: (data) => {
                        if (data[q.variable]) {
                          setDynamicChoices(prev => ({
                            ...prev,
                            [q.variable]: data[q.variable]!.choices,
                          }))
                        }
                      },
                    })
                  }}
                  title="Refresh choices"
                >
                  <RefreshCw className={`h-3 w-3 ${resolveDynamic.isPending ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto rounded border p-2 space-y-1">
              {choices.map(c => (
                <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selected.includes(c)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateAnswer(q.variable, [...selected, c])
                      } else {
                        updateAnswer(q.variable, selected.filter(s => s !== c))
                      }
                    }}
                  />
                  {c}
                </label>
              ))}
              {choices.length === 0 && (
                <span className="text-xs text-muted-foreground">No choices available</span>
              )}
            </div>
          </div>
        )
      }
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={hasSurvey ? 'max-w-lg max-h-[85vh] overflow-y-auto' : undefined}>
        <DialogHeader>
          <DialogTitle>Launch: {template.name}</DialogTitle>
        </DialogHeader>

        {(hasPrompts || hasSurvey) ? (
          <div className="space-y-4 py-2">
            {/* Survey questions */}
            {hasSurvey && surveyData?.spec && (
              <>
                {surveyData.name && (
                  <div className="text-sm font-medium text-muted-foreground border-b pb-2">
                    {surveyData.name}
                  </div>
                )}
                {surveyData.spec.map(q => (
                  <div key={q.variable} className="space-y-2">
                    <Label>
                      {q.question_name}
                      {q.required && <span className="text-destructive ml-1">*</span>}
                      {q.dynamic_choices?.enabled && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          dynamic
                        </span>
                      )}
                    </Label>
                    {q.question_description && (
                      <p className="text-xs text-muted-foreground">{q.question_description}</p>
                    )}
                    {renderSurveyQuestion(q)}
                  </div>
                ))}
                {hasPrompts && <div className="border-t pt-2" />}
              </>
            )}

            {/* Standard prompts */}
            {template.ask_job_type_on_launch && (
              <div className="space-y-2">
                <Label htmlFor="launch_job_type">Job Type</Label>
                <Select id="launch_job_type" value={jobType} onChange={(e) => setJobType(e.target.value)} options={jobTypeOptions} />
              </div>
            )}
            {template.ask_limit_on_launch && (
              <div className="space-y-2">
                <Label htmlFor="launch_limit">Limit</Label>
                <Input id="launch_limit" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="e.g. webservers" />
              </div>
            )}
            {template.ask_tags_on_launch && (
              <div className="space-y-2">
                <Label htmlFor="launch_tags">Job Tags</Label>
                <Input id="launch_tags" value={jobTags} onChange={(e) => setJobTags(e.target.value)} placeholder="Comma-separated" />
              </div>
            )}
            {template.ask_skip_tags_on_launch && (
              <div className="space-y-2">
                <Label htmlFor="launch_skip_tags">Skip Tags</Label>
                <Input id="launch_skip_tags" value={skipTags} onChange={(e) => setSkipTags(e.target.value)} placeholder="Comma-separated" />
              </div>
            )}
            {template.ask_verbosity_on_launch && (
              <div className="space-y-2">
                <Label htmlFor="launch_verbosity">Verbosity</Label>
                <Select id="launch_verbosity" value={verbosity} onChange={(e) => setVerbosity(e.target.value)} options={verbosityOptions} />
              </div>
            )}
            {template.ask_forks_on_launch && (
              <div className="space-y-2">
                <Label htmlFor="launch_forks">Forks</Label>
                <Input id="launch_forks" type="number" min="0" value={forks} onChange={(e) => setForks(e.target.value)} />
              </div>
            )}
            {template.ask_job_slice_count_on_launch && (
              <div className="space-y-2">
                <Label htmlFor="launch_slices">Job Slices</Label>
                <Input id="launch_slices" type="number" min="1" value={jobSliceCount} onChange={(e) => setJobSliceCount(e.target.value)} />
              </div>
            )}
            {template.ask_variables_on_launch && (
              <div className="space-y-2">
                <Label htmlFor="launch_vars">Extra Variables</Label>
                <CodeEditor
                  value={extraVars}
                  onChange={setExtraVars}
                  language="yaml"
                  height="200px"
                />
              </div>
            )}
          </div>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">
            This template will be launched with its default settings.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleLaunch} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="mr-1 h-4 w-4" />
            )}
            Launch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
