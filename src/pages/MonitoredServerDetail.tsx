import { useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, RotateCcw, TerminalSquare, Trash2 } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { RBACPanel } from '@/components/RBACPanel'
import { InstallPanel } from '@/components/monitored-servers/InstallPanel'
import { ServerStatusBadge } from '@/components/monitored-servers/ServerStatusBadge'
import {
  useMonitoredServer,
  useDeleteMonitoredServer,
  useIssueEnrollmentCode,
  useRotateAgentToken,
} from '@/api/hooks/useMonitoredServers'
import { formatRelativeTime } from '@/lib/utils'
import type { EnrollmentCode } from '@/api/types'

type Tab = 'details' | 'install' | 'access'

export function MonitoredServerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(searchParams.get('install') ? 'install' : 'details')
  const [showDelete, setShowDelete] = useState(false)
  const [showRotate, setShowRotate] = useState(false)
  const [code, setCode] = useState<EnrollmentCode | null>(null)

  const { data: server, isLoading } = useMonitoredServer(id)
  const deleteMutation = useDeleteMonitoredServer(id!)
  const issueMutation = useIssueEnrollmentCode(id!)
  const rotateMutation = useRotateAgentToken(id!)

  if (isLoading) return <DetailPageSkeleton />

  if (!server) {
    return (
      <div className="space-y-4">
        <Link to="/monitored_servers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Monitored servers
        </Link>
        <p className="text-muted-foreground">Monitored server not found.</p>
      </div>
    )
  }

  const caps = server.summary_fields?.user_capabilities
  const canRotate = !!caps?.rotate
  const canDelete = !!caps?.delete
  const canManageAccess = !!caps?.manage_access

  const issue = () => issueMutation.mutate(undefined, { onSuccess: setCode })

  return (
    <div className="space-y-6">
      <div>
        <Link to="/monitored_servers" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Monitored servers
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{server.name}</h1>
              <ServerStatusBadge online={server.online} />
            </div>
            {server.description && <p className="text-sm text-muted-foreground">{server.description}</p>}
          </div>

          <div className="flex items-center gap-2">
            {canRotate && (
              <Button variant="outline" size="sm" onClick={() => setShowRotate(true)}>
                <RotateCcw className="mr-1 h-4 w-4" />
                Rotate token
              </Button>
            )}
            {canDelete && (
              <Button variant="outline" size="sm" onClick={() => setShowDelete(true)}>
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b" role="tablist">
        {(['details', 'install', 'access'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize -mb-px border-b-2 ${tab === t ? 'border-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t === 'install' ? (
              <span className="inline-flex items-center gap-1">
                <TerminalSquare className="h-4 w-4" />
                Install
              </span>
            ) : (
              t
            )}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow
                label="Organization"
                value={server.summary_fields?.organization?.name}
                link={server.summary_fields?.organization ? `/organizations/${server.summary_fields.organization.id}` : undefined}
              />
              <DetailRow label="Owner" value={server.summary_fields?.owner?.username} />
              <DetailRow label="Last report" value={server.last_report_at ? formatRelativeTime(server.last_report_at) : 'never'} />
              <DetailRow label="Mobile id" value={server.mobile_server_id} mono />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow label="Created" value={formatRelativeTime(server.created)} />
              <DetailRow label="Created by" value={server.summary_fields?.created_by?.username} />
              <DetailRow label="Modified" value={formatRelativeTime(server.modified)} />
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'install' && <InstallPanel code={code} onIssue={issue} isIssuing={issueMutation.isPending} canIssue={canRotate} />}

      {tab === 'access' && (
        <RBACPanel
          objectRoles={server.summary_fields?.object_roles}
          readOnly={!canManageAccess}
          note={
            canManageAccess
              ? 'Admins of the organization and superusers grant and revoke access. The Forail Mobile app shows this list, read-only.'
              : 'Only the admins of this server’s organization and superusers can change who has access.'
          }
        />
      )}

      <ConfirmDialog
        open={showRotate}
        onOpenChange={setShowRotate}
        title="Rotate agent token"
        description={`The agent on "${server.name}" stops reporting at once, until it is enrolled again with the new one-time code.`}
        confirmLabel="Rotate"
        variant="destructive"
        isPending={rotateMutation.isPending}
        onConfirm={() =>
          rotateMutation.mutate(undefined, {
            onSuccess: (newCode) => {
              setShowRotate(false)
              setCode(newCode)
              setTab('install')
            },
          })
        }
      />

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete monitored server"
        description={`Delete "${server.name}"? Its metrics and logs are removed from Forail Mobile and the agent stops being accepted. This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(undefined, { onSuccess: () => navigate('/monitored_servers') })}
      />
    </div>
  )
}

function DetailRow({ label, value, link, mono }: { label: string; value?: string; link?: string; mono?: boolean }) {
  const display = value || '–'
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      {link ? (
        <Link to={link} className="text-primary hover:underline">
          {display}
        </Link>
      ) : (
        <span className={mono ? 'font-mono text-xs' : undefined}>{display}</span>
      )}
    </div>
  )
}
