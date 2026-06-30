import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { CodeEditor } from '@/components/CodeEditor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useJobTemplateDetail,
  useCreateJobTemplate,
  useUpdateJobTemplate,
  useProjectPlaybooks,
} from '@/api/hooks/useTemplates'
import { useProjects } from '@/api/hooks/useProjects'
import { useInventories } from '@/api/hooks/useInventories'
import { FormPageSkeleton } from '@/components/skeletons/FormPageSkeleton'

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

export function JobTemplateForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: template, isLoading } = useJobTemplateDetail(id ?? '')
  const createMutation = useCreateJobTemplate()
  const updateMutation = useUpdateJobTemplate(id ?? '')
  const { data: projectsData } = useProjects({ page_size: 200 })
  const { data: inventoriesData } = useInventories({ page_size: 200 })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [jobType, setJobType] = useState('run')
  const [inventory, setInventory] = useState('')
  const [project, setProject] = useState('')
  const [playbook, setPlaybook] = useState('')
  const [verbosity, setVerbosity] = useState('0')
  const [forks, setForks] = useState('0')
  const [limit, setLimit] = useState('')
  const [jobTags, setJobTags] = useState('')
  const [skipTags, setSkipTags] = useState('')
  const [jobSliceCount, setJobSliceCount] = useState('1')
  const [diffMode, setDiffMode] = useState(false)
  const [becomeEnabled, setBecomeEnabled] = useState(false)
  const [allowSimultaneous, setAllowSimultaneous] = useState(false)
  const [extraVars, setExtraVars] = useState('---')

  const { data: playbooks } = useProjectPlaybooks(project || undefined)

  useEffect(() => {
    if (isEdit && template) {
      setName(template.name)
      setDescription(template.description)
      setJobType(template.job_type === 'check' ? 'check' : 'run')
      setInventory(template.summary_fields?.inventory?.id?.toString() ?? '')
      setProject(template.summary_fields?.project?.id?.toString() ?? '')
      setPlaybook(template.playbook)
      setVerbosity(String(template.verbosity))
      setForks(String(template.forks))
      setLimit(template.limit)
      setJobTags(template.job_tags)
      setSkipTags(template.skip_tags)
      setJobSliceCount(String(template.job_slice_count))
      setDiffMode(template.diff_mode)
      setBecomeEnabled(template.become_enabled)
      setAllowSimultaneous(template.allow_simultaneous)
      setExtraVars(template.extra_vars || '---')
    }
  }, [isEdit, template])

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      name,
      description,
      job_type: jobType,
      playbook,
      verbosity: Number(verbosity),
      forks: Number(forks),
      limit,
      job_tags: jobTags,
      skip_tags: skipTags,
      job_slice_count: Number(jobSliceCount),
      diff_mode: diffMode,
      become_enabled: becomeEnabled,
      allow_simultaneous: allowSimultaneous,
      extra_vars: extraVars,
    }
    if (inventory) payload.inventory = Number(inventory)
    if (project) payload.project = Number(project)

    const mutation = isEdit ? updateMutation : createMutation
    mutation.mutate(payload, {
      onSuccess: (data) => navigate(`/templates/job_template/${data.id}`),
    })
  }

  if (isEdit && isLoading) {
    return <FormPageSkeleton />
  }

  const projectOptions = [
    { value: '', label: '-- Select Project --' },
    ...(projectsData?.results ?? []).map((p) => ({
      value: String(p.id),
      label: p.name,
    })),
  ]

  const inventoryOptions = [
    { value: '', label: '-- Select Inventory --' },
    ...(inventoriesData?.results ?? []).map((i) => ({
      value: String(i.id),
      label: i.name,
    })),
  ]

  const playbookOptions = [
    { value: '', label: '-- Select Playbook --' },
    ...(playbooks ?? []).map((p) => ({ value: p, label: p })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/templates"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Templates
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit Job Template' : 'Create Job Template'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="job_type">Job Type</Label>
                <Select id="job_type" value={jobType} onChange={(e) => setJobType(e.target.value)} options={jobTypeOptions} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inventory">Inventory</Label>
                <Select id="inventory" value={inventory} onChange={(e) => setInventory(e.target.value)} options={inventoryOptions} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select id="project" value={project} onChange={(e) => { setProject(e.target.value); setPlaybook('') }} options={projectOptions} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="playbook">Playbook</Label>
                <Select id="playbook" value={playbook} onChange={(e) => setPlaybook(e.target.value)} options={playbookOptions} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Execution</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="verbosity">Verbosity</Label>
                <Select id="verbosity" value={verbosity} onChange={(e) => setVerbosity(e.target.value)} options={verbosityOptions} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="forks">Forks</Label>
                <Input id="forks" type="number" min="0" value={forks} onChange={(e) => setForks(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_slice_count">Job Slices</Label>
                <Input id="job_slice_count" type="number" min="1" value={jobSliceCount} onChange={(e) => setJobSliceCount(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="limit">Limit</Label>
                <Input id="limit" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="e.g. webservers" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="job_tags">Job Tags</Label>
                <Input id="job_tags" value={jobTags} onChange={(e) => setJobTags(e.target.value)} placeholder="Comma-separated tags" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skip_tags">Skip Tags</Label>
                <Input id="skip_tags" value={skipTags} onChange={(e) => setSkipTags(e.target.value)} placeholder="Comma-separated tags" />
              </div>
            </div>
            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch id="diff_mode" checked={diffMode} onCheckedChange={setDiffMode} />
                <Label htmlFor="diff_mode">Diff Mode</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="become_enabled" checked={becomeEnabled} onCheckedChange={setBecomeEnabled} />
                <Label htmlFor="become_enabled">Privilege Escalation</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="allow_simultaneous" checked={allowSimultaneous} onCheckedChange={setAllowSimultaneous} />
                <Label htmlFor="allow_simultaneous">Allow Simultaneous</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Extra Variables</CardTitle></CardHeader>
          <CardContent>
            <CodeEditor
              value={extraVars}
              onChange={setExtraVars}
              language="yaml"
              height="200px"
            />
          </CardContent>
        </Card>

        {(createMutation.error || updateMutation.error) && (
          <p className="text-sm text-destructive">
            {(createMutation.error || updateMutation.error)?.message || 'An error occurred.'}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending || !name}>
            {isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            {isEdit ? 'Save Changes' : 'Create Template'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
