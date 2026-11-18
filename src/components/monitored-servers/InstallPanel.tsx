import { useEffect, useState } from 'react'
import { Check, Copy, KeyRound, Loader2, RefreshCw, TerminalSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EnrollmentCode } from '@/api/types'

/** Seconds left until `expiresAt`, never negative. */
export function secondsLeft(expiresAt: string, now: number = Date.now()): number {
  const end = Date.parse(expiresAt)
  if (Number.isNaN(end)) return 0
  return Math.max(0, Math.floor((end - now) / 1000))
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

interface InstallPanelProps {
  /** The code to show, or null before one was issued. */
  code: EnrollmentCode | null
  /** Ask for a fresh code. */
  onIssue: () => void
  isIssuing: boolean
  /** False hides the button: the user may not issue codes for this server. */
  canIssue: boolean
}

/**
 * How to install the agent on the server. Shows a one-time enrollment code with a countdown and
 * the exact command to run. It never shows a long-lived agent token: the agent exchanges the code
 * for one on the host itself.
 */
export function InstallPanel({ code, onIssue, isIssuing, canIssue }: InstallPanelProps) {
  const [now, setNow] = useState(() => Date.now())
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!code) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [code])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const left = code ? secondsLeft(code.expires_at, now) : 0
  const expired = !!code && left === 0

  const copy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code.command)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Card data-testid="install-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TerminalSquare className="h-5 w-5" />
          Install the agent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>Copy <code>forail-agent</code> to the server (<code>/usr/local/bin/</code>).</li>
          <li>Run the command below as root. The code works once and expires after 10 minutes.</li>
          <li>Install and start the systemd unit; the server shows as online within a minute.</li>
        </ol>

        {!code && (
          <p className="text-muted-foreground">
            {canIssue ? 'Issue a one-time enrollment code to get the install command.' : 'Only the owner and the admins of its organization can issue an enrollment code.'}
          </p>
        )}

        {code && !expired && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-muted-foreground">
                <KeyRound className="h-4 w-4" />
                One-time code, expires in
                <span className="font-mono font-medium text-foreground" data-testid="countdown">{formatCountdown(left)}</span>
              </span>
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                {copied ? 'Copied' : 'Copy command'}
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs" data-testid="install-command">{code.command}</pre>
          </div>
        )}

        {expired && (
          <p className="text-amber-600 dark:text-amber-400" data-testid="code-expired">
            This code has expired. Issue a new one; nothing was installed with it.
          </p>
        )}

        {canIssue && (
          <Button size="sm" onClick={onIssue} disabled={isIssuing}>
            {isIssuing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}
            {code ? 'Issue a new code' : 'Issue enrollment code'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
