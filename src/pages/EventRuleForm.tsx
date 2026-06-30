import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import { FormPageSkeleton } from '@/components/skeletons/FormPageSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  useEventRuleDetail,
  useCreateEventRule,
  useUpdateEventRule,
} from '@/api/hooks/useEventRules'
import { useOrganizations } from '@/api/hooks/useOrganizations'
import type { EventRuleCondition, EventRuleAction, EventRuleSourceType } from '@/api/types'

const SOURCE_TYPE_OPTIONS = [
  { value: 'webhook_generic', label: 'Generic Webhook' },
  { value: 'webhook_github', label: 'GitHub' },
  { value: 'webhook_gitlab', label: 'GitLab' },
  { value: 'alertmanager', label: 'Alertmanager' },
  { value: 'pagerduty', label: 'PagerDuty' },
  { value: 'datadog', label: 'Datadog' },
  { value: 'cloudwatch', label: 'CloudWatch' },
]

const ACTION_TYPE_OPTIONS = [
  { value: 'launch_job_template', label: 'Launch Job Template' },
  { value: 'launch_workflow', label: 'Launch Workflow' },
  { value: 'send_notification', label: 'Send Notification' },
]

export function EventRuleForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: existing, isLoading } = useEventRuleDetail(id ?? '')
  const createMutation = useCreateEventRule()
  const updateMutation = useUpdateEventRule(id ?? '')
  const { data: orgs } = useOrganizations({ page_size: 200 })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [organization, setOrganization] = useState<string>('')
  const [enabled, setEnabled] = useState(true)
  const [sourceType, setSourceType] = useState<EventRuleSourceType>('webhook_generic')
  const [webhookPath, setWebhookPath] = useState('')
  const [throttleSeconds, setThrottleSeconds] = useState(0)
  const [conditions, setConditions] = useState<EventRuleCondition[]>([])
  const [actions, setActions] = useState<EventRuleAction[]>([
    { action_type: 'launch_job_template', target_id: 0 },
  ])

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setDescription(existing.description)
      setOrganization(existing.organization?.toString() ?? '')
      setEnabled(existing.enabled)
      setSourceType(existing.source_type)
      setWebhookPath(existing.webhook_path)
      setThrottleSeconds(existing.throttle_seconds)
      setConditions(existing.conditions)
      setActions(existing.actions)
    }
  }, [existing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Actions are required; a rule whose actions all have an unset target would
    // be saved able-to-do-nothing. Require at least one real action.
    const validActions = actions.filter(a => a.target_id > 0)
    if (validActions.length === 0) {
      toast.error('Add at least one action with a target.')
      return
    }
    const payload = {
      name,
      description,
      organization: organization ? Number(organization) : null,
      enabled,
      source_type: sourceType,
      webhook_path: webhookPath,
      throttle_seconds: throttleSeconds,
      conditions,
      actions: validActions,
    }

    if (isEdit) {
      updateMutation.mutate(payload, {
        onSuccess: () => navigate(`/event_rules/${id}`),
      })
    } else {
      createMutation.mutate(payload, {
        onSuccess: (data) => navigate(`/event_rules/${data.id}`),
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (isEdit && isLoading) return <FormPageSkeleton />

  const addCondition = () => {
    setConditions([...conditions, { jinja2_expression: '', description: '' }])
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, field: keyof EventRuleCondition, value: string) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index]!, [field]: value }
    setConditions(updated)
  }

  const addAction = () => {
    setActions([...actions, { action_type: 'launch_job_template', target_id: 0 }])
  }

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const updateAction = (index: number, field: keyof EventRuleAction, value: unknown) => {
    const updated = [...actions]
    updated[index] = { ...updated[index]!, [field]: value }
    setActions(updated)
  }

  const orgOptions = [
    { value: '', label: '-- Select Organization --' },
    ...(orgs?.results ?? []).map(o => ({ value: String(o.id), label: o.name })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/event_rules"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Event Rules
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit Event Rule' : 'Create Event Rule'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle>General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org">Organization</Label>
                <Select id="org" value={organization} onChange={e => setOrganization(e.target.value)} options={orgOptions} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
              <Label htmlFor="enabled">Enabled</Label>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Config */}
        <Card>
          <CardHeader><CardTitle>Webhook Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="source_type">Source Type</Label>
                <Select
                  id="source_type"
                  value={sourceType}
                  onChange={e => setSourceType(e.target.value as EventRuleSourceType)}
                  options={SOURCE_TYPE_OPTIONS}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook_path">Webhook Path *</Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">/api/v2/eda_webhooks/</span>
                  <Input
                    id="webhook_path"
                    value={webhookPath}
                    onChange={e => setWebhookPath(e.target.value)}
                    placeholder="my-hook"
                    pattern="^[a-zA-Z0-9_-]+$"
                    required
                  />
                  <span className="text-sm text-muted-foreground">/</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="throttle">Throttle (seconds)</Label>
              <Input
                id="throttle"
                type="number"
                min={0}
                value={throttleSeconds}
                onChange={e => setThrottleSeconds(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Minimum time between rule firings. 0 = no throttling.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Conditions</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                <Plus className="mr-1 h-4 w-4" />
                Add Condition
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {conditions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No conditions defined. The rule will match all incoming webhooks.
              </p>
            )}
            {conditions.map((c, i) => (
              <div key={i} className="flex gap-2 rounded border p-3">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Jinja2 expression, e.g. event.action == 'opened'"
                    value={c.jinja2_expression}
                    onChange={e => updateCondition(i, 'jinja2_expression', e.target.value)}
                    className="font-mono text-sm"
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={c.description ?? ''}
                    onChange={e => updateCondition(i, 'description', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeCondition(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Actions *</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addAction}>
                <Plus className="mr-1 h-4 w-4" />
                Add Action
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {actions.map((a, i) => (
              <div key={i} className="flex gap-2 rounded border p-3">
                <div className="flex-1 space-y-2">
                  <div className="grid gap-2 md:grid-cols-2">
                    <Select
                      value={a.action_type}
                      onChange={e => updateAction(i, 'action_type', e.target.value)}
                      options={ACTION_TYPE_OPTIONS}
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="Target ID"
                      value={a.target_id || ''}
                      onChange={e => updateAction(i, 'target_id', Number(e.target.value))}
                    />
                  </div>
                  <Input
                    placeholder="Description (optional)"
                    value={a.description ?? ''}
                    onChange={e => updateAction(i, 'description', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAction(i)}
                  disabled={actions.length <= 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Event Rule'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
