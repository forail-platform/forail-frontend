import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useCreateMonitoredServer } from '@/api/hooks/useMonitoredServers'
import { useOrganizations } from '@/api/hooks/useOrganizations'
import { extractApiError } from '@/api/client'

/** Same rule as the platform and the mobile backend: the name goes into signed approvals. */
export const SERVER_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$/

/** What to tell the user when registering fails, by the platform's answer. */
export function createErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail
    if (status === 409) return detail || 'You have reached the number of servers you may register.'
    if (status === 503) return 'Forail Mobile is not available right now. Try again later, or ask an administrator.'
    if (status === 403) return 'You can only register servers in an organization you belong to.'
    const body = JSON.stringify(error.response?.data ?? '')
    if (status === 400 && /unique|already exists|must make a unique set/i.test(body)) {
      return 'A server with this name already exists in this organization.'
    }
  }
  return extractApiError(error)
}

export function MonitoredServerForm() {
  const navigate = useNavigate()
  const createMutation = useCreateMonitoredServer()
  const { data: orgs } = useOrganizations({ page_size: 200 })

  const [name, setName] = useState('')
  const [organization, setOrganization] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const only = orgs?.results?.length === 1 ? orgs.results[0] : undefined
    if (!organization && only) setOrganization(String(only.id))
  }, [orgs, organization])

  const nameValid = SERVER_NAME.test(name)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!nameValid) {
      setError('Use 1–63 letters, digits, dots, dashes or underscores, starting with a letter or digit.')
      return
    }
    if (!organization) {
      setError('Choose an organization.')
      return
    }
    createMutation.mutate(
      { name, organization: Number(organization), description },
      {
        // Straight to the install panel: the next step is enrolling the agent.
        onSuccess: (server) => navigate(`/monitored_servers/${server.id}?install=1`),
        onError: (err) => setError(createErrorMessage(err)),
      },
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/monitored_servers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Register a server</h1>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Server</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ms-name">Name *</Label>
                <Input id="ms-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="web-01" required />
                <p className="text-xs text-muted-foreground">Unique within the organization. It cannot be changed later.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ms-org">Organization *</Label>
                <Select
                  id="ms-org"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  options={[
                    { value: '', label: '-- Choose --' },
                    ...(orgs?.results ?? []).map((o) => ({ value: String(o.id), label: o.name })),
                  ]}
                />
                <p className="text-xs text-muted-foreground">Its admins can manage the server and share it.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ms-desc">Description</Label>
              <Textarea id="ms-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                Register
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
