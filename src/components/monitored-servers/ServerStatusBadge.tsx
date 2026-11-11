import { Badge } from '@/components/ui/badge'

/** Online, offline, or unknown when Forail Mobile could not be asked. */
export function ServerStatusBadge({ online }: { online: boolean | null | undefined }) {
  if (online === null || online === undefined) {
    return <Badge variant="outline" className="text-muted-foreground">unknown</Badge>
  }
  return online ? (
    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">online</Badge>
  ) : (
    <Badge variant="secondary">offline</Badge>
  )
}
