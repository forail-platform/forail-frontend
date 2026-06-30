import { useState, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useScanResults, useScanners } from '@/api/hooks/useScanners'
import { formatRelativeTime } from '@/lib/utils'
import type { ScanStatus } from '@/api/types'

const STATUS_VARIANT: Record<ScanStatus, 'success' | 'outline' | 'error' | 'secondary'> = {
  ok: 'success',
  warn: 'outline',
  blocked: 'error',
  error: 'error',
  timeout: 'secondary',
}

export function ScanResults() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [status, setStatus] = useState<string>('')
  const [scanner, setScanner] = useState<string>('')
  const [since, setSince] = useState<string>('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const { data, isLoading } = useScanResults({
    page, page_size: pageSize,
    status: (status || undefined) as ScanStatus | undefined,
    scanner: scanner || undefined,
    since: since || undefined,
  })

  const { data: scannerList } = useScanners({ page_size: 100 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldAlert className="h-6 w-6" /> Scan Results
        </h1>
        <p className="text-sm text-muted-foreground">
          Audit trail of every IaC scan run on a launch attempt.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'ok', label: 'OK' },
            { value: 'warn', label: 'Warn' },
            { value: 'blocked', label: 'Blocked' },
            { value: 'error', label: 'Error' },
            { value: 'timeout', label: 'Timeout' },
          ]}
        />
        <Select
          value={scanner}
          onChange={(e) => { setScanner(e.target.value); setPage(1) }}
          options={[
            { value: '', label: 'All scanners' },
            ...((scannerList?.results ?? []).map((s) => ({ value: String(s.id), label: s.name }))),
          ]}
        />
        <Input
          type="date"
          value={since}
          onChange={(e) => { setSince(e.target.value); setPage(1) }}
          className="max-w-[180px]"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No scan results logged yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">When</th>
                  <th className="p-3">Scanner</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Highest</th>
                  <th className="p-3">Findings</th>
                  <th className="p-3">Job</th>
                  <th className="p-3">Message</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((r) => (
                  <Fragment key={r.id}>
                    <tr
                      className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    >
                      <td className="p-3 text-muted-foreground">{formatRelativeTime(r.created)}</td>
                      <td className="p-3">{r.scanner_name || '—'}</td>
                      <td className="p-3">
                        <Badge variant={STATUS_VARIANT[r.status] ?? 'outline'}>{r.status}</Badge>
                      </td>
                      <td className="p-3 text-xs">{r.highest_severity || '—'}</td>
                      <td className="p-3 text-muted-foreground">{r.finding_count}</td>
                      <td className="p-3">
                        {r.unified_job ? (
                          <Link to={`/jobs/${r.unified_job}`} className="text-primary hover:underline">
                            #{r.unified_job}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{r.message}</td>
                    </tr>
                    {expanded === r.id && (
                      <tr key={`${r.id}-detail`} className="border-b bg-muted/20">
                        <td colSpan={7} className="p-3">
                          {r.findings && r.findings.length > 0 ? (
                            <div className="text-xs">
                              <div className="font-medium mb-1">Findings</div>
                              <table className="w-full">
                                <thead className="text-left text-[10px] uppercase text-muted-foreground">
                                  <tr>
                                    <th className="py-1 pr-3">Rule</th>
                                    <th className="py-1 pr-3">Severity</th>
                                    <th className="py-1 pr-3">File:Line</th>
                                    <th className="py-1 pr-3">Message</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {r.findings.map((f) => (
                                    <tr key={f.id} className="border-t">
                                      <td className="py-1 pr-3 font-mono">{f.rule_id}</td>
                                      <td className="py-1 pr-3">
                                        <Badge variant="outline" className="text-[10px]">{f.severity}</Badge>
                                      </td>
                                      <td className="py-1 pr-3 font-mono text-muted-foreground">
                                        {f.file_path}{f.line ? `:${f.line}` : ''}
                                      </td>
                                      <td className="py-1 pr-3">{f.message}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">No findings recorded.</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {data && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          totalCount={data.count}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        />
      )}
    </div>
  )
}
