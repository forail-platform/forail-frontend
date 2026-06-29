import { Loader2, CalendarDays } from 'lucide-react'
import { useSchedulePreview } from '@/api/hooks/useSchedules'

interface SchedulePreviewProps {
  rrule: string
}

export function SchedulePreview({ rrule }: SchedulePreviewProps) {
  const { data, isLoading, isError, error } = useSchedulePreview(rrule)

  if (!rrule.includes('RRULE')) {
    return (
      <div className="rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
        Configure a recurrence rule to see upcoming dates.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading preview...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {(error as Error)?.message || 'Invalid recurrence rule'}
      </div>
    )
  }

  const dates = data?.local ?? []

  if (dates.length === 0) {
    return (
      <div className="rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
        No upcoming occurrences.
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-muted/50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <CalendarDays className="h-4 w-4" />
        Next {Math.min(dates.length, 10)} occurrences
      </div>
      <ul className="space-y-1">
        {dates.slice(0, 10).map((d) => (
          <li key={String(d)} className="text-xs text-muted-foreground font-mono">
            {new Date(d).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  )
}
