import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Play,
  FileText,
  Server,
  Monitor,
  FolderGit2,
  KeyRound,
  ServerCog,
  Building2,
  Users,
  UsersRound,
  Settings,
  Clock,
  Activity,
  ChevronLeft,
  ChevronRight,
  Anvil,
  Cpu,
  Layers,
  Container,
  Network,
  Bell,
  ShieldCheck,
  Zap,
  ScrollText,
  Webhook,
  GitCompare,
  AlertTriangle,
  ShieldAlert,
  Camera,
  BarChart3,
  Store,
  ClipboardList,
  Inbox,
  LayoutGrid,
  FileLock2,
  Gavel,
  ScanLine,
  Gauge,
  Wand2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

interface NavItem {
  labelKey: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  titleKey: string
  items: NavItem[]
  wizardPath?: string
}

const GROUP_WIZARDS: Record<string, string> = {
  'nav.automation': '/wizards/automation',
  'nav.self_service': '/wizards/self-service',
  'nav.tenancy': '/wizards/tenancy',
  'nav.compliance': '/wizards/compliance',
  'nav.resources': '/wizards/resources',
  'nav.access': '/wizards/access',
}

const navigation: NavGroup[] = [
  {
    titleKey: 'nav.views',
    items: [
      { labelKey: 'nav.dashboard', path: '/dashboard', icon: LayoutDashboard },
      { labelKey: 'nav.jobs', path: '/jobs', icon: Play },
      { labelKey: 'nav.schedules', path: '/schedules', icon: Clock },
      { labelKey: 'nav.activity', path: '/activity', icon: Activity },
      { labelKey: 'nav.audit', path: '/audit', icon: ShieldCheck },
      { labelKey: 'nav.analytics', path: '/analytics', icon: BarChart3 },
    ],
  },
  {
    titleKey: 'nav.automation',
    items: [
      { labelKey: 'nav.event_rules', path: '/event_rules', icon: Zap },
      { labelKey: 'nav.event_logs', path: '/event_logs', icon: ScrollText },
      { labelKey: 'nav.outbound_webhooks', path: '/outbound_webhooks', icon: Webhook },
    ],
  },
  {
    titleKey: 'nav.self_service',
    items: [
      { labelKey: 'nav.service_portal', path: '/service_portal', icon: Store },
      { labelKey: 'nav.my_requests', path: '/my_requests', icon: ClipboardList },
      { labelKey: 'nav.service_approvals', path: '/service_approvals', icon: Inbox },
      { labelKey: 'nav.service_catalog', path: '/service_catalog', icon: LayoutGrid },
    ],
  },
  {
    titleKey: 'nav.tenancy',
    items: [
      { labelKey: 'nav.tenants', path: '/tenants', icon: Building2 },
      { labelKey: 'nav.tenant_quota_events', path: '/tenant_quota_events', icon: Gauge },
    ],
  },
  {
    titleKey: 'nav.compliance',
    items: [
      { labelKey: 'nav.drift_detections', path: '/drift_detections', icon: GitCompare },
      { labelKey: 'nav.drift_alerts', path: '/drift_alerts', icon: AlertTriangle },
      { labelKey: 'nav.drift_alert_rules', path: '/drift_alert_rules', icon: ShieldAlert },
      { labelKey: 'nav.fact_snapshots', path: '/fact_snapshots', icon: Camera },
      { labelKey: 'nav.policies', path: '/policies', icon: FileLock2 },
      { labelKey: 'nav.policy_decisions', path: '/policy_decisions', icon: Gavel },
      { labelKey: 'nav.scanners', path: '/scanners', icon: ScanLine },
      { labelKey: 'nav.scan_results', path: '/scan_results', icon: ShieldAlert },
      { labelKey: 'nav.observability', path: '/observability', icon: Activity },
    ],
  },
  {
    titleKey: 'nav.resources',
    items: [
      { labelKey: 'nav.templates', path: '/templates', icon: FileText },
      { labelKey: 'nav.inventories', path: '/inventories', icon: Server },
      { labelKey: 'nav.hosts', path: '/hosts', icon: Monitor },
      { labelKey: 'nav.projects', path: '/projects', icon: FolderGit2 },
      { labelKey: 'nav.credentials', path: '/credentials', icon: KeyRound },
      { labelKey: 'nav.monitored_servers', path: '/monitored_servers', icon: ServerCog },
    ],
  },
  {
    titleKey: 'nav.access',
    items: [
      { labelKey: 'nav.organizations', path: '/organizations', icon: Building2 },
      { labelKey: 'nav.users', path: '/users', icon: Users },
      { labelKey: 'nav.teams', path: '/teams', icon: UsersRound },
    ],
  },
  {
    titleKey: 'nav.admin',
    items: [
      { labelKey: 'nav.instances', path: '/instances', icon: Cpu },
      { labelKey: 'nav.instance_groups', path: '/instance_groups', icon: Layers },
      { labelKey: 'nav.execution_env', path: '/execution_environments', icon: Container },
      { labelKey: 'nav.notifications', path: '/notification_templates', icon: Bell },
      { labelKey: 'nav.topology', path: '/topology', icon: Network },
      { labelKey: 'nav.settings', path: '/settings', icon: Settings },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r bg-card transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-14 items-center border-b px-3">
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          <Anvil className="h-7 w-7 shrink-0 text-primary" />
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">Forail</span>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navigation.map((group) => (
          <div key={group.titleKey} className="mb-4">
            {!collapsed && (
              <div className="mb-1 flex items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>{t(group.titleKey)}</span>
                {GROUP_WIZARDS[group.titleKey] && (
                  <Link
                    to={GROUP_WIZARDS[group.titleKey] as string}
                    title={t('wizards.title')}
                    className="rounded p-0.5 hover:bg-accent hover:text-foreground"
                  >
                    <Wand2 className="h-3 w-3" />
                  </Link>
                )}
              </div>
            )}
            {collapsed && <div className="mb-1 border-b" />}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const label = t(item.labelKey)
                const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'))
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      title={collapsed ? label : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        collapsed && 'justify-center px-0',
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="w-full"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  )
}
