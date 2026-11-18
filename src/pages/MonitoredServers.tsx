import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useReactTable, getCoreRowModel, createColumnHelper, type SortingState } from '@tanstack/react-table'
import { Search, RefreshCw, Plus, ServerCog } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { ServerStatusBadge } from '@/components/monitored-servers/ServerStatusBadge'
import { useMonitoredServers } from '@/api/hooks/useMonitoredServers'
import { formatRelativeTime } from '@/lib/utils'
import type { MonitoredServer } from '@/api/types'

const columnHelper = createColumnHelper<MonitoredServer>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <Link to={`/monitored_servers/${info.row.original.id}`} className="font-medium text-primary hover:underline">
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor((row) => row.online, {
    id: 'status',
    header: 'Status',
    enableSorting: false,
    cell: (info) => <ServerStatusBadge online={info.getValue()} />,
  }),
  columnHelper.accessor((row) => row.summary_fields?.organization?.name ?? '', {
    id: 'organization',
    header: 'Organization',
    enableSorting: false,
    cell: (info) => info.getValue() || <span className="text-muted-foreground">–</span>,
  }),
  columnHelper.accessor((row) => row.summary_fields?.owner?.username ?? '', {
    id: 'owner',
    header: 'Owner',
    enableSorting: false,
    cell: (info) => info.getValue() || <span className="text-muted-foreground">–</span>,
  }),
  columnHelper.accessor('last_report_at', {
    header: 'Last report',
    enableSorting: false,
    cell: (info) => {
      const value = info.getValue()
      return <span className="text-muted-foreground">{value ? formatRelativeTime(value) : 'never'}</span>
    },
  }),
]

export function MonitoredServers() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const queryClient = useQueryClient()

  const orderBy = useMemo(() => {
    const s = sorting[0]
    if (!s) return 'name'
    return s.desc ? `-${s.id}` : s.id
  }, [sorting])

  const { data, isLoading, isFetching, isError } = useMonitoredServers({
    page,
    page_size: pageSize,
    order_by: orderBy,
    search: search || undefined,
  })

  const table = useReactTable({
    data: data?.results ?? [],
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      setSorting(updater)
      setPage(1)
    },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  })

  const mobileUnreachable = !!data && data.results.length > 0 && data.results.every((s) => s.online === null)
  const empty = !isLoading && !isError && data?.count === 0 && !search

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Monitored servers</h1>
        <p className="text-sm text-muted-foreground">
          Servers running forail-agent. Their metrics and logs reach the Forail Mobile app; who can see them follows Forail access.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSearch(searchInput)
            setPage(1)
          }}
          className="relative flex-1 min-w-[200px] max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search servers..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
        </form>
        <Link to="/monitored_servers/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Register server
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['monitored_servers'] })}
          disabled={isFetching}
        >
          <RefreshCw className={`mr-1 h-4 w-4${isFetching ? ' animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {mobileUnreachable && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200" data-testid="mobile-unreachable">
          Forail Mobile cannot be reached, so online status is unknown. Ask an administrator to check FORAIL_MOBILE_URL.
        </p>
      )}

      {empty ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed py-12 text-center" data-testid="empty-state">
          <ServerCog className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">No monitored servers yet</p>
            <p className="text-sm text-muted-foreground">Register a server, then install forail-agent on it with a one-time code.</p>
          </div>
          <Link to="/monitored_servers/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Register server
            </Button>
          </Link>
        </div>
      ) : (
        <DataTable table={table} isLoading={isLoading} />
      )}

      {data && data.count > 0 && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          totalCount={data.count}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
      )}
    </div>
  )
}
