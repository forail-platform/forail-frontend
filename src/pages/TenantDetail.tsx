import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Loader2, Pencil, Trash, RefreshCw, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useTenant,
  useDeleteTenant,
  useRecalculateTenant,
  useTenantQuotaEvents,
  useTenantIsolationEvents,
} from '@/api/hooks/useTenants'
import { formatRelativeTime } from '@/lib/utils'
import type { TenantQuotaKind } from '@/api/types'

function usageColor(current: number, limit: number | null): string {
  if (limit === null || limit === 0) return 'bg-green-500'
  const pct = (current / limit) * 100
  if (pct > 90) return 'bg-red-500'
  if (pct > 50) return 'bg-yellow-500'
  return 'bg-green-500'
}

function UsageCard({
  label,
  current,
  limit,
}: {
  label: string
  current: number
  limit: number | null
}) {
  const unlimited = limit === null || limit === 0
  const pct = unlimited ? 0 : Math.min(100, (current / limit) * 100)
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="text-xs uppercase text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold">
          {current}
          <span className="text-sm font-normal text-muted-foreground">
            {' / '}{unlimited ? '∞' : limit}
          </span>
        </div>
        {!unlimited && (
          <div className="h-2 w-full overflow-hidden rounded bg-muted">
            <div
              className={`h-full ${usageColor(current, limit)}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        {unlimited && <div className="text-xs text-muted-foreground">unlimited</div>}
      </CardContent>
    </Card>
  )
}

const QUOTA_KIND_LABELS: Record<TenantQuotaKind, string> = {
  concurrent_jobs: 'tenants.quota_kind_concurrent_jobs',
  daily_launches: 'tenants.quota_kind_daily_launches',
  hosts: 'tenants.quota_kind_hosts',
  storage_mb: 'tenants.quota_kind_storage_mb',
}

export function TenantDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)

  const { data: tenant, isLoading, isError } = useTenant(id)
  const deleteMutation = useDeleteTenant()
  const recalcMutation = useRecalculateTenant(id ?? '')
  const { data: events } = useTenantQuotaEvents({
    organization: id,
    page_size: 10,
  })
  const { data: isolationEvents } = useTenantIsolationEvents({
    user_organization: id,
    page_size: 10,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !tenant) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Tenant not found.
      </div>
    )
  }

  const onDelete = () => {
    deleteMutation.mutate(tenant.id, {
      onSuccess: () => navigate('/tenants'),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/tenants">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-6 w-6" /> {tenant.name}
        </h1>
        {tenant.branding.custom_domain && (
          <Badge variant="outline">{tenant.branding.custom_domain}</Badge>
        )}
        {tenant.isolation_strict && (
          <Badge variant="warning">Strict Isolation</Badge>
        )}
        <div className="ml-auto flex gap-2">
          <Link to={`/tenants/${tenant.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-1 h-4 w-4" /> Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => recalcMutation.mutate()}
            disabled={recalcMutation.isPending}
          >
            <RefreshCw className={`mr-1 h-4 w-4 ${recalcMutation.isPending ? 'animate-spin' : ''}`} />
            {t('tenants.recalculate')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('tenants.branding')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            {tenant.branding.logo_url ? (
              <img
                src={tenant.branding.logo_url}
                alt=""
                className="h-16 w-16 rounded object-contain border"
              />
            ) : (
              <div className="h-16 w-16 rounded border bg-muted" />
            )}
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">{t('tenants.primary_color')}:</span>{' '}
                <span
                  className="inline-block h-4 w-4 rounded border align-middle"
                  style={{ backgroundColor: tenant.branding.primary_color }}
                />{' '}
                <span className="font-mono text-xs">{tenant.branding.primary_color}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('tenants.secondary_color')}:</span>{' '}
                <span
                  className="inline-block h-4 w-4 rounded border align-middle"
                  style={{ backgroundColor: tenant.branding.secondary_color }}
                />{' '}
                <span className="font-mono text-xs">{tenant.branding.secondary_color}</span>
              </div>
              <div className="text-muted-foreground">
                {t('tenants.custom_domain')}: {tenant.branding.custom_domain || '—'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">{t('tenants.usage')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UsageCard
            label={t('tenants.max_concurrent_jobs')}
            current={tenant.usage.concurrent_jobs_count}
            limit={tenant.quota.max_concurrent_jobs}
          />
          <UsageCard
            label={t('tenants.max_daily_launches')}
            current={tenant.usage.launches_today_count}
            limit={tenant.quota.max_daily_launches}
          />
          <UsageCard
            label={t('tenants.max_hosts')}
            current={tenant.usage.hosts_count}
            limit={tenant.quota.max_hosts}
          />
          <UsageCard
            label={t('tenants.max_storage_mb')}
            current={tenant.usage.storage_mb_used}
            limit={tenant.quota.max_storage_mb}
          />
        </div>
        {tenant.quota.api_rate_limit ? (
          <p className="text-xs text-muted-foreground mt-2">
            API rate limit: {tenant.quota.api_rate_limit} req/s
          </p>
        ) : null}
        {tenant.usage.last_recalculated_at && (
          <p className="text-xs text-muted-foreground mt-2">
            Last recalculated {formatRelativeTime(tenant.usage.last_recalculated_at)}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('tenants.quota_events')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!events || events.results.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No events.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">When</th>
                  <th className="p-3">Kind</th>
                  <th className="p-3">Decision</th>
                  <th className="p-3">Current / Limit</th>
                  <th className="p-3">Message</th>
                </tr>
              </thead>
              <tbody>
                {events.results.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="p-3 text-xs text-muted-foreground">
                      {formatRelativeTime(e.created)}
                    </td>
                    <td className="p-3 text-xs">{t(QUOTA_KIND_LABELS[e.quota_kind])}</td>
                    <td className="p-3">
                      <Badge variant={e.decision === 'blocked' ? 'error' : 'success'}>
                        {t(`tenants.decision_${e.decision}`)}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs">
                      {e.current_value} / {e.limit_value ?? '∞'}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Isolation Events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!isolationEvents || isolationEvents.results.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No isolation events.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">When</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Target Org</th>
                  <th className="p-3">Resource</th>
                  <th className="p-3">Path</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {isolationEvents.results.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="p-3 text-xs text-muted-foreground">
                      {formatRelativeTime(e.created)}
                    </td>
                    <td className="p-3 text-xs">{e.user ?? '—'}</td>
                    <td className="p-3 text-xs">{e.accessed_organization ?? '—'}</td>
                    <td className="p-3 text-xs">
                      {e.resource_type}{e.resource_id ? ` #${e.resource_id}` : ''}
                    </td>
                    <td className="p-3 text-xs font-mono text-muted-foreground">{e.request_path}</td>
                    <td className="p-3">
                      <Badge variant={e.blocked ? 'error' : 'outline'}>
                        {e.blocked ? 'Blocked' : 'Audit'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card className="border-red-500/40">
        <CardHeader>
          <CardTitle className="text-red-600">{t('tenants.danger_zone')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setShowDelete(true)}>
            <Trash className="mr-1 h-4 w-4" /> Delete tenant
          </Button>
        </CardContent>
      </Card>

      {showDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowDelete(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2">{t('tenants.delete_confirm')}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t('tenants.delete_warning')}
            </p>
            <p className="text-sm font-medium mb-4">{tenant.name}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={onDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
