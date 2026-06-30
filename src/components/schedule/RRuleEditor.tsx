import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { RRule, Weekday } from 'rrule'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useScheduleZoneInfo } from '@/api/hooks/useSchedules'

const FREQ_OPTIONS = [
  { value: String(RRule.MINUTELY), label: 'Minutely' },
  { value: String(RRule.HOURLY), label: 'Hourly' },
  { value: String(RRule.DAILY), label: 'Daily' },
  { value: String(RRule.WEEKLY), label: 'Weekly' },
  { value: String(RRule.MONTHLY), label: 'Monthly' },
  { value: String(RRule.YEARLY), label: 'Yearly' },
]

const WEEKDAYS = [
  { label: 'Mon', value: RRule.MO },
  { label: 'Tue', value: RRule.TU },
  { label: 'Wed', value: RRule.WE },
  { label: 'Thu', value: RRule.TH },
  { label: 'Fri', value: RRule.FR },
  { label: 'Sat', value: RRule.SA },
  { label: 'Sun', value: RRule.SU },
]

const END_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'count', label: 'After N occurrences' },
  { value: 'until', label: 'On date' },
]

interface RRuleEditorProps {
  value: string
  onChange: (rrule: string) => void
}

function toLocalDatetime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function RRuleEditor({ value, onChange }: RRuleEditorProps) {
  const { data: zoneInfoData } = useScheduleZoneInfo()

  const [freq, setFreq] = useState(RRule.DAILY)
  const [interval, setInterval] = useState(1)
  const [byWeekday, setByWeekday] = useState<Weekday[]>([])
  const [dtstart, setDtstart] = useState(toLocalDatetime(new Date()))
  const [endType, setEndType] = useState<'never' | 'count' | 'until'>('never')
  const [count, setCount] = useState(10)
  const [until, setUntil] = useState('')
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)

  // Tracks the rrule string we last emitted (so we don't re-parse our own output)
  // and whether the next build should be suppressed (it reflects a parse, not a
  // user edit). skipBuildRef starts true to skip the initial mount build — on an
  // edit form `value` arrives a render *after* mount, so emitting on mount would
  // clobber the schedule the parent is about to load.
  const lastEmittedRef = useRef<string | null>(null)
  const skipBuildRef = useRef(true)

  // Parse the incoming rrule whenever it changes externally (edit-form load or a
  // parent reset), ignoring the value we ourselves emitted.
  useEffect(() => {
    if (!value || !value.includes('RRULE')) return
    if (value === lastEmittedRef.current) return
    try {
      const lines = value.split('\n').filter((l) => l.trim())
      const dtstartLine = lines.find((l) => l.startsWith('DTSTART'))
      const rruleLine = lines.find((l) => l.startsWith('RRULE'))
      if (!rruleLine) return

      // Parse DTSTART
      if (dtstartLine) {
        const tzMatch = dtstartLine.match(/TZID=([^:]+)/)
        if (tzMatch?.[1]) setTimezone(tzMatch[1])
        const dateMatch = dtstartLine.match(/(\d{8}T\d{6})/)
        if (dateMatch?.[1]) {
          const s = dateMatch[1]!
          const parsed = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}`
          setDtstart(parsed)
        }
      }

      const rule = RRule.fromString(rruleLine)
      setFreq(rule.options.freq)
      setInterval(rule.options.interval || 1)
      if (rule.options.byweekday) {
        setByWeekday(rule.options.byweekday.map((d: number) => new Weekday(d)))
      }
      if (rule.options.count) {
        setEndType('count')
        setCount(rule.options.count)
      } else if (rule.options.until) {
        setEndType('until')
        setUntil(toLocalDatetime(rule.options.until))
      } else {
        setEndType('never')
      }
    } catch {
      // invalid rrule, keep defaults
    }
    // The state updates above will re-run the build effect; suppress that one
    // emit so we echo the parsed schedule rather than overwriting it.
    skipBuildRef.current = true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const buildRRule = useCallback(() => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const d = new Date(dtstart)
    const dtstartStr = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`

    const opts: Record<string, unknown> = {
      freq,
      interval,
    }
    if (freq === RRule.WEEKLY && byWeekday.length > 0) {
      opts.byweekday = byWeekday
    }
    if (endType === 'count') {
      opts.count = Math.min(Math.max(count, 1), 999)
    } else if (endType === 'until' && until) {
      opts.until = new Date(until)
    }

    const rule = new RRule(opts as ConstructorParameters<typeof RRule>[0])
    const rrulePart = rule.toString().replace('RRULE:', '')

    return `DTSTART;TZID=${timezone}:${dtstartStr}\nRRULE:${rrulePart}`
  }, [freq, interval, byWeekday, dtstart, endType, count, until, timezone])

  useEffect(() => {
    // Skip the build that immediately follows mount or a parse — only user-driven
    // state changes should emit a new rrule.
    if (skipBuildRef.current) {
      skipBuildRef.current = false
      return
    }
    const newRrule = buildRRule()
    if (newRrule !== value) {
      lastEmittedRef.current = newRrule
      onChange(newRrule)
    }
  }, [buildRRule, onChange, value])

  const timezoneOptions = useMemo(() => {
    const zones = zoneInfoData?.zones ?? [
      'UTC', 'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific',
      'Europe/London', 'Europe/Berlin', 'Europe/Belgrade', 'Asia/Tokyo',
    ]
    return zones.map((z) => ({ value: z, label: z }))
  }, [zoneInfoData])

  const toggleWeekday = (day: Weekday) => {
    setByWeekday((prev) =>
      prev.some((d) => d.weekday === day.weekday)
        ? prev.filter((d) => d.weekday !== day.weekday)
        : [...prev, day],
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select
            value={String(freq)}
            onChange={(e) => setFreq(Number(e.target.value))}
            options={FREQ_OPTIONS}
          />
        </div>
        <div className="space-y-2">
          <Label>Every</Label>
          <Input
            type="number"
            min={1}
            max={999}
            value={interval}
            onChange={(e) => setInterval(Math.max(1, Number(e.target.value)))}
          />
        </div>
        <div className="space-y-2">
          <Label>Timezone</Label>
          <Select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            options={timezoneOptions}
          />
        </div>
      </div>

      {freq === RRule.WEEKLY && (
        <div className="space-y-2">
          <Label>Days of Week</Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map(({ label, value: day }) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleWeekday(day)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  byWeekday.some((d) => d.weekday === day.weekday)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-accent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Start Date/Time</Label>
          <Input
            type="datetime-local"
            value={dtstart}
            onChange={(e) => setDtstart(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>End</Label>
          <Select
            value={endType}
            onChange={(e) => setEndType(e.target.value as 'never' | 'count' | 'until')}
            options={END_OPTIONS}
          />
        </div>
        {endType === 'count' && (
          <div className="space-y-2">
            <Label>Occurrences</Label>
            <Input
              type="number"
              min={1}
              max={999}
              value={count}
              onChange={(e) => setCount(Math.min(999, Math.max(1, Number(e.target.value))))}
            />
          </div>
        )}
        {endType === 'until' && (
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="datetime-local"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
