import { useState, useRef, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Moon, Sun, LogOut, User, Menu, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useLogout } from '@/api/hooks/useAuth'

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/jobs': 'Jobs',
  '/templates': 'Templates',
  '/inventories': 'Inventories',
  '/projects': 'Projects',
  '/credentials': 'Credentials',
  '/monitored_servers': 'Monitored servers',
  '/organizations': 'Organizations',
  '/users': 'Users',
  '/teams': 'Teams',
  '/settings': 'Settings',
}

interface TopBarProps {
  onMobileMenuToggle: () => void
}

export function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const { theme, toggleTheme } = useThemeStore()
  const logout = useLogout()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  let pageTitle = routeLabels[location.pathname]
  if (!pageTitle && location.pathname.match(/^\/jobs\/\d+/)) {
    pageTitle = 'Job Detail'
  }
  pageTitle = pageTitle ?? 'Forail'

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && userMenuOpen) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [userMenuOpen])

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMobileMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <nav className="flex items-center text-sm">
          <span className="font-medium">{pageTitle}</span>
        </nav>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {user?.username?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <span className="hidden text-sm sm:inline">
              {user?.username ?? 'User'}
            </span>
          </Button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border bg-card py-1 shadow-lg" role="menu">
              <div className="border-b px-3 py-2">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Link
                to="/users/me"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent"
                onClick={() => setUserMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <Link
                to="/me/security"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent"
                onClick={() => setUserMenuOpen(false)}
              >
                <ShieldCheck className="h-4 w-4" />
                Security
              </Link>
              <button
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent"
                onClick={() => logout.mutate()}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
