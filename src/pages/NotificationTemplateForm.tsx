import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useNotificationTemplateDetail,
  useCreateNotificationTemplate,
  useUpdateNotificationTemplate,
} from '@/api/hooks/useNotifications'
import { useOrganizations } from '@/api/hooks/useOrganizations'
import type { NotificationType } from '@/api/types'
import { FormPageSkeleton } from '@/components/skeletons/FormPageSkeleton'

const TYPE_OPTIONS = [
  { value: '', label: '-- Select Type --' },
  { value: 'email', label: 'Email' },
  { value: 'slack', label: 'Slack' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'pagerduty', label: 'PagerDuty' },
  { value: 'mattermost', label: 'Mattermost' },
  { value: 'rocketchat', label: 'Rocket.Chat' },
  { value: 'twilio', label: 'Twilio' },
  { value: 'awssns', label: 'AWS SNS' },
  { value: 'grafana', label: 'Grafana' },
  { value: 'irc', label: 'IRC' },
]

interface ConfigField {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'textarea'
  required?: boolean
}

const CONFIG_FIELDS: Record<string, ConfigField[]> = {
  email: [
    { key: 'host', label: 'SMTP Host', type: 'text', required: true },
    { key: 'port', label: 'SMTP Port', type: 'number', required: true },
    { key: 'username', label: 'Username', type: 'text' },
    { key: 'password', label: 'Password', type: 'password' },
    { key: 'use_tls', label: 'Use TLS', type: 'text' },
    { key: 'use_ssl', label: 'Use SSL', type: 'text' },
    { key: 'sender', label: 'Sender Email', type: 'text', required: true },
    { key: 'recipients', label: 'Recipients (one per line)', type: 'textarea', required: true },
  ],
  slack: [
    { key: 'token', label: 'Bot Token', type: 'password', required: true },
    { key: 'channels', label: 'Channels (one per line)', type: 'textarea', required: true },
    { key: 'hex_color', label: 'Notification Color', type: 'text' },
  ],
  webhook: [
    { key: 'url', label: 'Target URL', type: 'text', required: true },
    { key: 'http_method', label: 'HTTP Method', type: 'text' },
    { key: 'headers', label: 'Headers (JSON)', type: 'textarea' },
    { key: 'username', label: 'Username', type: 'text' },
    { key: 'password', label: 'Password', type: 'password' },
    { key: 'disable_ssl_verification', label: 'Disable SSL Verification', type: 'text' },
  ],
  pagerduty: [
    { key: 'token', label: 'API Token', type: 'password', required: true },
    { key: 'subdomain', label: 'Subdomain', type: 'text', required: true },
    { key: 'service_key', label: 'Integration Key', type: 'text', required: true },
    { key: 'client_name', label: 'Client Name', type: 'text' },
  ],
  mattermost: [
    { key: 'mattermost_url', label: 'URL', type: 'text', required: true },
    { key: 'mattermost_channel', label: 'Channel', type: 'text' },
    { key: 'mattermost_username', label: 'Username', type: 'text' },
    { key: 'mattermost_icon_url', label: 'Icon URL', type: 'text' },
    { key: 'mattermost_no_verify_ssl', label: 'Disable SSL', type: 'text' },
  ],
  rocketchat: [
    { key: 'rocketchat_url', label: 'URL', type: 'text', required: true },
    { key: 'rocketchat_no_verify_ssl', label: 'Disable SSL', type: 'text' },
  ],
  twilio: [
    { key: 'account_sid', label: 'Account SID', type: 'text', required: true },
    { key: 'account_token', label: 'Account Token', type: 'password', required: true },
    { key: 'from_number', label: 'From Number', type: 'text', required: true },
    { key: 'to_numbers', label: 'To Numbers (one per line)', type: 'textarea', required: true },
  ],
  awssns: [
    { key: 'aws_access_key_id', label: 'Access Key ID', type: 'text' },
    { key: 'aws_secret_access_key', label: 'Secret Access Key', type: 'password' },
    { key: 'aws_region', label: 'Region', type: 'text', required: true },
    { key: 'sns_topic_arn', label: 'SNS Topic ARN', type: 'text', required: true },
  ],
  grafana: [
    { key: 'grafana_url', label: 'Grafana URL', type: 'text', required: true },
    { key: 'grafana_key', label: 'API Key', type: 'password', required: true },
    { key: 'dashboardId', label: 'Dashboard ID', type: 'number' },
    { key: 'panelId', label: 'Panel ID', type: 'number' },
    { key: 'annotation_tags', label: 'Tags (one per line)', type: 'textarea' },
    { key: 'grafana_no_verify_ssl', label: 'Disable SSL', type: 'text' },
  ],
  irc: [
    { key: 'server', label: 'IRC Server', type: 'text', required: true },
    { key: 'port', label: 'Port', type: 'number', required: true },
    { key: 'nickname', label: 'Nickname', type: 'text', required: true },
    { key: 'password', label: 'Password', type: 'password' },
    { key: 'targets', label: 'Channels / Users (one per line)', type: 'textarea', required: true },
    { key: 'use_ssl', label: 'Use SSL', type: 'text' },
  ],
}

export function NotificationTemplateForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: template, isLoading } = useNotificationTemplateDetail(id ?? '')
  const createMutation = useCreateNotificationTemplate()
  const updateMutation = useUpdateNotificationTemplate(id ?? '')
  const { data: orgsData } = useOrganizations({ page_size: 200 })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [organization, setOrganization] = useState('')
  const [notificationType, setNotificationType] = useState<string>('')
  const [config, setConfig] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isEdit && template) {
      setName(template.name)
      setDescription(template.description)
      setOrganization(template.organization ? String(template.organization) : '')
      setNotificationType(template.notification_type)
      const cfg: Record<string, string> = {}
      for (const [k, v] of Object.entries(template.notification_configuration)) {
        if (typeof v === 'string' && v.startsWith('$encrypted$')) {
          cfg[k] = ''
        } else if (Array.isArray(v)) {
          cfg[k] = v.join('\n')
        } else {
          cfg[k] = String(v ?? '')
        }
      }
      setConfig(cfg)
    }
  }, [isEdit, template])

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fields = CONFIG_FIELDS[notificationType] ?? []
    const notification_configuration: Record<string, unknown> = {}
    for (const field of fields) {
      const val = config[field.key] ?? ''
      if (field.type === 'textarea' && (field.key === 'recipients' || field.key === 'channels' || field.key === 'to_numbers' || field.key === 'targets' || field.key === 'annotation_tags')) {
        notification_configuration[field.key] = val.split('\n').map((s) => s.trim()).filter(Boolean)
      } else if (field.key === 'headers') {
        // Webhook headers is an object field — the API rejects a raw string
        // ("expected object"), so parse the JSON (empty means no headers, {}).
        try {
          notification_configuration[field.key] = val.trim() ? JSON.parse(val) : {}
        } catch {
          toast.error('Headers must be a valid JSON object.')
          return
        }
      } else if (field.type === 'number') {
        notification_configuration[field.key] = val ? Number(val) : 0
      } else if (val === 'true' || val === 'false') {
        notification_configuration[field.key] = val === 'true'
      } else if (val) {
        // Only send filled optional fields — forcing empty strings onto typed
        // fields (e.g. the boolean disable_ssl_verification) makes the API
        // reject them ("expected bool"); omitting them lets the default apply.
        notification_configuration[field.key] = val
      }
    }

    const payload: Record<string, unknown> = {
      name,
      description,
      notification_type: notificationType as NotificationType,
      notification_configuration,
    }
    if (organization) payload.organization = Number(organization)

    const mutation = isEdit ? updateMutation : createMutation
    mutation.mutate(payload, {
      onSuccess: (data) => navigate(`/notification_templates/${data.id}`),
    })
  }

  if (isEdit && isLoading) {
    return <FormPageSkeleton />
  }

  const orgOptions = [
    { value: '', label: '-- Select Organization --' },
    ...(orgsData?.results ?? []).map((o) => ({
      value: String(o.id),
      label: o.name,
    })),
  ]

  const currentFields = CONFIG_FIELDS[notificationType] ?? []

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/notification_templates"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Notification Templates
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit Notification Template' : 'Create Notification Template'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Select id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} options={orgOptions} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification_type">Notification Type *</Label>
              <Select
                id="notification_type"
                value={notificationType}
                onChange={(e) => {
                  setNotificationType(e.target.value)
                  setConfig({})
                }}
                options={TYPE_OPTIONS}
              />
            </div>
          </CardContent>
        </Card>

        {notificationType && currentFields.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {currentFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label}{field.required ? ' *' : ''}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.key}
                      value={config[field.key] ?? ''}
                      onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                      rows={3}
                    />
                  ) : (
                    <Input
                      id={field.key}
                      type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'}
                      value={config[field.key] ?? ''}
                      onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                      placeholder={isEdit && field.type === 'password' ? 'Leave empty to keep current' : ''}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {(createMutation.error || updateMutation.error) && (
          <p className="text-sm text-destructive">
            {(createMutation.error || updateMutation.error)?.message || 'An error occurred.'}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending || !name || !notificationType}>
            {isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            {isEdit ? 'Save Changes' : 'Create'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
