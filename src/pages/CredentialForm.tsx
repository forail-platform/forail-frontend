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
import { useCredentialDetail, useCreateCredential, useUpdateCredential, useCredentialTypes } from '@/api/hooks/useCredentials'
import { useOrganizations } from '@/api/hooks/useOrganizations'
import { FormPageSkeleton } from '@/components/skeletons/FormPageSkeleton'

export function CredentialForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: credential, isLoading } = useCredentialDetail(id ?? '')
  const createMutation = useCreateCredential()
  const updateMutation = useUpdateCredential(id ?? '')
  const { data: orgsData } = useOrganizations({ page_size: 200 })
  const { data: credTypesData } = useCredentialTypes()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [organization, setOrganization] = useState('')
  const [credentialType, setCredentialType] = useState('')
  const [inputsJson, setInputsJson] = useState('{}')

  useEffect(() => {
    if (isEdit && credential) {
      setName(credential.name)
      setDescription(credential.description)
      setOrganization(credential.organization?.toString() ?? '')
      setCredentialType(String(credential.credential_type))
      setInputsJson(JSON.stringify(credential.inputs, null, 2))
    }
  }, [isEdit, credential])

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let inputs: Record<string, unknown> = {}
    if (inputsJson.trim()) {
      try {
        inputs = JSON.parse(inputsJson)
      } catch {
        // Abort rather than silently submitting {} — that would wipe the
        // credential's stored secrets.
        toast.error('Credential inputs must be valid JSON.')
        return
      }
    }

    const payload: Record<string, unknown> = {
      name,
      description,
      credential_type: Number(credentialType),
      inputs,
    }
    if (organization) payload.organization = Number(organization)

    const mutation = isEdit ? updateMutation : createMutation
    mutation.mutate(payload, {
      onSuccess: (data) => navigate(`/credentials/${data.id}`),
    })
  }

  if (isEdit && isLoading) {
    return <FormPageSkeleton />
  }

  const orgOptions = [
    { value: '', label: '-- No Organization --' },
    ...(orgsData?.results ?? []).map((o) => ({
      value: String(o.id),
      label: o.name,
    })),
  ]

  const credTypeOptions = [
    { value: '', label: '-- Select Type --' },
    ...(credTypesData?.results ?? []).map((ct) => ({
      value: String(ct.id),
      label: `${ct.name} (${ct.kind})`,
    })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/credentials"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Credentials
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit Credential' : 'Create Credential'}
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
                <Label htmlFor="credential_type">Credential Type *</Label>
                <Select id="credential_type" value={credentialType} onChange={(e) => setCredentialType(e.target.value)} options={credTypeOptions} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Select id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} options={orgOptions} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Inputs</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={inputsJson}
              onChange={(e) => setInputsJson(e.target.value)}
              rows={8}
              className="font-mono text-xs"
              placeholder="{}"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              JSON object with credential-specific fields (e.g. username, password, ssh_key_data).
            </p>
          </CardContent>
        </Card>

        {(createMutation.error || updateMutation.error) && (
          <p className="text-sm text-destructive">
            {(createMutation.error || updateMutation.error)?.message || 'An error occurred.'}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending || !name || !credentialType}>
            {isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            {isEdit ? 'Save Changes' : 'Create Credential'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
