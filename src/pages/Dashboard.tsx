import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Server,
  Building2,
  FileText,
  FolderGit2,
  KeyRound,
  Users,
  ArrowRight,
  Wand2,
  X,
  Lightbulb,
} from 'lucide-react'
import { useRecommendations } from '@/api/hooks/useRecommendations'
import type { Recommendation, RecommendationSeverity } from '@/api/types'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDashboard, useRecentJobs, useJobGraph } from '@/api/hooks/useDashboard'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
import { statusConfig } from '@/lib/statusConfig'
import { formatRelativeTime } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number | undefined
  failed?: number
  icon: React.ComponentType<{ className?: string }>
  href: string
}

function StatCard({ title, value, failed, icon: Icon, href }: StatCardProps) {
  return (
    <Link to={href}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                {value !== undefined ? value.toLocaleString() : '--'}
              </p>
              {failed !== undefined && failed > 0 && (
                <span className="text-xs text-destructive">
                  {failed} failed
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

const GETTING_STARTED_KEY = 'forail.dashboard.gettingStarted.dismissed'

const severityStyles: Record<RecommendationSeverity, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  warn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
}

export function Dashboard() {
  const { t } = useTranslation()
  const { data: dashboard, isLoading: dashLoading } = useDashboard()
  const { data: recentJobs, isLoading: jobsLoading } = useRecentJobs()
  const { data: graphData, isLoading: graphLoading } = useJobGraph()
  const { data: recsData } = useRecommendations('dashboard')

  const [gsDismissed, setGsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(GETTING_STARTED_KEY) === '1'
  })

  useEffect(() => {
    if (gsDismissed) localStorage.setItem(GETTING_STARTED_KEY, '1')
  }, [gsDismissed])

  const dashRecs: Recommendation[] = recsData?.results ?? []
  const topRecs = dashRecs.slice(0, 5)
  const grouped: Record<RecommendationSeverity, Recommendation[]> = {
    critical: dashRecs.filter((r) => r.severity === 'critical'),
    warn: dashRecs.filter((r) => r.severity === 'warn'),
    info: dashRecs.filter((r) => r.severity === 'info'),
  }

  if (dashLoading || jobsLoading || graphLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {!gsDismissed && (
        <Card className="border-primary/30">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
              <Wand2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{t('recommendations.getting_started')}</h2>
                  <p className="text-sm text-muted-foreground">
                    Finish initial setup: org, project, inventory, credential, first template.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setGsDismissed(true)}
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3">
                <Link to="/wizards/getting-started">
                  <Button>
                    <Wand2 className="mr-1 h-4 w-4" /> {t('wizards.getting_started_title')}
                  </Button>
                </Link>
              </div>
              {topRecs.length > 0 && (
                <ul className="mt-4 space-y-1">
                  {topRecs.map((r) => (
                    <li key={r.id} className="flex items-center gap-2 text-sm">
                      <Badge className={cn('text-[10px]', severityStyles[r.severity])}>
                        {t(`recommendations.severity_${r.severity}`)}
                      </Badge>
                      <span>{r.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title={t('dashboard.hosts')}
          value={dashboard?.hosts.total}
          failed={dashboard?.hosts.failed}
          icon={Server}
          href="/inventories"
        />
        <StatCard
          title={t('dashboard.templates')}
          value={dashboard?.job_templates.total}
          icon={FileText}
          href="/templates"
        />
        <StatCard
          title={t('dashboard.projects')}
          value={dashboard?.projects.total}
          failed={dashboard?.projects.failed}
          icon={FolderGit2}
          href="/projects"
        />
        <StatCard
          title={t('dashboard.credentials')}
          value={dashboard?.credentials.total}
          icon={KeyRound}
          href="/credentials"
        />
        <StatCard
          title={t('dashboard.organizations')}
          value={dashboard?.organizations.total}
          icon={Building2}
          href="/organizations"
        />
        <StatCard
          title={t('dashboard.users')}
          value={dashboard?.users.total}
          icon={Users}
          href="/users"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Jobs */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-4">
            <CardTitle className="text-base">{t('dashboard.recent_jobs')}</CardTitle>
            <Link to="/jobs">
              <Button variant="ghost" size="sm" className="gap-1">
                {t('dashboard.view_all')} <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentJobs?.results.length ? (
              <div className="space-y-3">
                {recentJobs.results.map((job) => {
                  const config = statusConfig[job.status]
                  const StatusIcon = config.icon
                  return (
                    <div
                      key={job.id}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <StatusIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {job.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {job.finished
                              ? formatRelativeTime(job.finished)
                              : job.status}
                          </p>
                        </div>
                      </div>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('dashboard.no_recent_jobs')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Job Activity Chart */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{t('dashboard.job_activity')}</CardTitle>
          </CardHeader>
          <CardContent>
            {graphData && graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={graphData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) => {
                      const date = new Date(d)
                      return `${date.getMonth() + 1}/${date.getDate()}`
                    }}
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="successful"
                    fill="#10B981"
                    radius={[2, 2, 0, 0]}
                    name="Successful"
                  />
                  <Bar
                    dataKey="failed"
                    fill="#F43F5E"
                    radius={[2, 2, 0, 0]}
                    name="Failed"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.no_job_data')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {dashRecs.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4" /> {t('recommendations.suggestions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(['critical', 'warn', 'info'] as RecommendationSeverity[]).map((sev) =>
              grouped[sev].length === 0 ? null : (
                <div key={sev} className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t(`recommendations.severity_${sev}`)}
                  </div>
                  <ul className="space-y-2">
                    {grouped[sev].map((r) => (
                      <li
                        key={r.id}
                        className="flex items-start justify-between gap-3 rounded-md border p-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className={cn('text-[10px]', severityStyles[sev])}>
                              {t(`recommendations.severity_${sev}`)}
                            </Badge>
                            <span className="text-sm font-medium">{r.title}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{r.why}</p>
                        </div>
                        {r.action_link && (
                          <Link to={r.action_link}>
                            <Button variant="outline" size="sm">
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
