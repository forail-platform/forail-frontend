import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  Clock,
  Target,
  Server,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  useJobTrends,
  useSuccessRate,
  useTopTemplates,
  useBusiestHosts,
  useHostCoverage,
  useFailureAnalysis,
  useTimeSavings,
} from '@/api/hooks/useAnalytics'

const PERIOD_OPTIONS = [
  { value: 'week', label: 'Last Week' },
  { value: 'two_weeks', label: 'Last 2 Weeks' },
  { value: 'month', label: 'Last Month' },
  { value: 'quarter', label: 'Last Quarter' },
  { value: 'year', label: 'Last Year' },
]

const PIE_COLORS = ['#10B981', '#6B7280']

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
}

function StatCard({ title, value, subtitle, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export function Analytics() {
  const [period, setPeriod] = useState('month')
  const [multiplier, setMultiplier] = useState(10)

  const { data: trends } = useJobTrends(period)
  const { data: successRate } = useSuccessRate(period)
  const { data: topTemplates } = useTopTemplates(period)
  const { data: busiestHosts } = useBusiestHosts(period)
  const { data: coverage } = useHostCoverage(period)
  const { data: failures } = useFailureAnalysis(period)
  // Clamp to the field's min so an empty input (Number('') === 0) can't compute a
  // meaningless 0x manual time.
  const { data: savings } = useTimeSavings(period, Math.max(1, multiplier))

  const totalJobs = successRate?.reduce((sum, r) => sum + r.total, 0) ?? 0
  const totalSuccessful = successRate?.reduce((sum, r) => sum + r.successful, 0) ?? 0
  const overallSuccessRate = totalJobs > 0 ? Math.round(totalSuccessful / totalJobs * 100) : 0

  const coveragePieData = coverage ? [
    { name: 'Automated', value: coverage.automated_hosts },
    { name: 'Not Automated', value: coverage.total_hosts - coverage.automated_hosts },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Automation insights, trends, and time savings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Period</Label>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              options={PERIOD_OPTIONS}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Manual Multiplier</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Jobs"
          value={totalJobs.toLocaleString()}
          icon={TrendingUp}
        />
        <StatCard
          title="Success Rate"
          value={`${overallSuccessRate}%`}
          subtitle={`${totalSuccessful} of ${totalJobs} succeeded`}
          icon={Target}
        />
        <StatCard
          title="Time Saved"
          value={savings ? `${savings.time_saved_hours.toLocaleString()}h` : '--'}
          subtitle={savings ? `${savings.job_count} jobs automated` : ''}
          icon={Clock}
        />
        <StatCard
          title="Host Coverage"
          value={coverage ? `${coverage.coverage_pct}%` : '--'}
          subtitle={coverage ? `${coverage.automated_hosts} of ${coverage.total_hosts} hosts` : ''}
          icon={Server}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Job Duration Trends */}
        <Card>
          <CardHeader><CardTitle className="text-base">Job Duration Trends</CardTitle></CardHeader>
          <CardContent>
            {trends && trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatDuration(v)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--foreground))' }}
                    formatter={(v: number) => formatDuration(v)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="avg_duration" stroke="#3B82F6" name="Avg Duration" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-muted-foreground">No job data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader><CardTitle className="text-base">Success Rate</CardTitle></CardHeader>
          <CardContent>
            {successRate && successRate.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={successRate}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="successful" stackId="1" fill="#10B981" stroke="#10B981" name="Successful" />
                  <Area type="monotone" dataKey="failed" stackId="1" fill="#F43F5E" stroke="#F43F5E" name="Failed" />
                  <Area type="monotone" dataKey="error" stackId="1" fill="#F59E0B" stroke="#F59E0B" name="Error" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-muted-foreground">No job data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Templates */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top Templates</CardTitle></CardHeader>
          <CardContent>
            {topTemplates && topTemplates.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topTemplates} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="template_name" type="category" width={150} stroke="hsl(var(--muted-foreground))" fontSize={11} tick={{ fill: 'hsl(var(--foreground))' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="run_count" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Runs" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-muted-foreground">No template data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Host Coverage */}
        <Card>
          <CardHeader><CardTitle className="text-base">Host Coverage</CardTitle></CardHeader>
          <CardContent>
            {coverage && coverage.total_hosts > 0 ? (
              <div className="flex items-center gap-8">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={coveragePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {coveragePieData.map((_entry, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  <div className="text-3xl font-bold">{coverage.coverage_pct}%</div>
                  <p className="text-sm text-muted-foreground">
                    {coverage.automated_hosts} of {coverage.total_hosts} hosts automated
                  </p>
                  {coverage.by_inventory.slice(0, 5).map(inv => (
                    <div key={inv.inventory_id} className="flex items-center justify-between text-sm">
                      <Link to={`/inventories/${inv.inventory_id}`} className="text-primary hover:underline truncate max-w-[150px]">
                        {inv.name}
                      </Link>
                      <Badge variant="outline">{inv.pct}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[180px] items-center justify-center">
                <p className="text-sm text-muted-foreground">No host data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Busiest Hosts */}
        <Card>
          <CardHeader><CardTitle className="text-base">Busiest Hosts</CardTitle></CardHeader>
          <CardContent>
            {busiestHosts && busiestHosts.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={busiestHosts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="host_name" type="category" width={150} stroke="hsl(var(--muted-foreground))" fontSize={11} tick={{ fill: 'hsl(var(--foreground))' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Bar dataKey="total_ok" stackId="a" fill="#10B981" name="OK" />
                  <Bar dataKey="total_changed" stackId="a" fill="#3B82F6" name="Changed" />
                  <Bar dataKey="total_failures" stackId="a" fill="#F43F5E" name="Failures" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-muted-foreground">No host data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Failure Analysis */}
        <Card>
          <CardHeader><CardTitle className="text-base">Failure Analysis</CardTitle></CardHeader>
          <CardContent>
            {failures && (failures.by_template.length > 0 || failures.by_host.length > 0) ? (
              <div className="space-y-4">
                {failures.by_template.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">By Template</p>
                    <div className="space-y-1">
                      {failures.by_template.slice(0, 5).map((t, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[200px]">{t.template_name}</span>
                          <Badge variant="error">{t.failure_count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {failures.by_host.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">By Host</p>
                    <div className="space-y-1">
                      {failures.by_host.slice(0, 5).map((h, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[200px]">{h.host_name}</span>
                          <Badge variant="error">{h.failure_count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-[180px] items-center justify-center">
                <p className="text-sm text-muted-foreground">No failures in this period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time Savings Calculator */}
      <Card>
        <CardHeader><CardTitle className="text-base">Time Savings Calculator</CardTitle></CardHeader>
        <CardContent>
          {savings ? (
            <div className="grid gap-6 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Automated Time</p>
                <p className="text-2xl font-bold">{formatDuration(savings.total_automated_seconds)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Est. Manual Time ({multiplier}x)</p>
                <p className="text-2xl font-bold">{formatDuration(savings.estimated_manual_seconds)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Time Saved</p>
                <p className="text-2xl font-bold text-green-600">{savings.time_saved_hours.toLocaleString()}h</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Avg Job Duration</p>
                <p className="text-2xl font-bold">{formatDuration(savings.avg_job_duration)}</p>
              </div>
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
