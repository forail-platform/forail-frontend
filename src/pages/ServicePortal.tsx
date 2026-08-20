import { lazy, Suspense, useMemo, useState } from 'react'
import { Search, Store, ShieldCheck, Workflow, FileText, Loader2 } from 'lucide-react'
import dynamicIconImports from 'lucide-react/dynamicIconImports'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ServiceRequestDialog } from '@/components/ServiceRequestDialog'
import { useServiceCatalogItems } from '@/api/hooks/useServiceCatalog'
import type { ServiceCatalogItem } from '@/api/types'

// A catalog item names its icon, so any icon in the set can be asked for. That
// used to be `import * as Icons from 'lucide-react'`, which pulls the entire
// library -- roughly 700 kB of icons, of which a page shows a handful. Loading
// them one at a time costs a request per distinct icon and nothing up front.
const iconKeys = Object.keys(dynamicIconImports)

function toKebabCase(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function CatalogIcon({ name, className }: { name: string; className?: string }) {
  // Memoised on the name: lazy() called during render would return a new
  // component type every pass, and React would unmount and remount the icon
  // each time.
  const Icon = useMemo(() => {
    const key = toKebabCase(name || '')
    if (!key || !iconKeys.includes(key)) return null
    return lazy(dynamicIconImports[key as keyof typeof dynamicIconImports])
  }, [name])

  if (!Icon) return <Store className={className} />
  // The fallback is the same shape and size as the icon, so nothing shifts
  // while the module arrives.
  return (
    <Suspense fallback={<Store className={className} />}>
      <Icon className={className} />
    </Suspense>
  )
}

export function ServicePortal() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [selected, setSelected] = useState<ServiceCatalogItem | null>(null)

  const { data, isLoading } = useServiceCatalogItems({
    page_size: 100,
    enabled: 'true',
    search: search || undefined,
    category: category || undefined,
  })

  const items = data?.results ?? []
  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const i of items) if (i.category) set.add(i.category)
    return Array.from(set).sort()
  }, [items])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Store className="h-6 w-6" />
          Service Portal
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse curated automations and submit a request to launch them.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSearch(searchInput)
          }}
          className="relative flex-1 min-w-[200px] max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search catalog..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[
            { value: '', label: 'All categories' },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No catalog items available.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            return (
              <Card key={item.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="rounded-md bg-muted p-2">
                      <CatalogIcon name={item.icon} className="h-5 w-5" />
                    </div>
                    <div className="flex gap-1">
                      {item.is_workflow && (
                        <Badge variant="outline" className="gap-1">
                          <Workflow className="h-3 w-3" /> Workflow
                        </Badge>
                      )}
                      {item.requires_approval && (
                        <Badge variant="outline" className="gap-1">
                          <ShieldCheck className="h-3 w-3" /> Approval
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="mt-2">{item.name}</CardTitle>
                  {item.category && (
                    <CardDescription>{item.category}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.description || 'No description.'}
                  </p>
                  {item.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => setSelected(item)}>
                    <FileText className="mr-1 h-4 w-4" /> Request
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {selected && (
        <ServiceRequestDialog
          open={!!selected}
          onOpenChange={(o) => !o && setSelected(null)}
          catalogItem={selected}
        />
      )}
    </div>
  )
}
