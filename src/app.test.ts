/**
 * Route completeness test — verifies that every page has a route
 * and that route patterns follow conventions.
 *
 * This is a static analysis test, not a render test.
 */
import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const APP_SOURCE = fs.readFileSync(
  path.resolve(__dirname, 'App.tsx'),
  'utf-8',
)

describe('Route completeness', () => {
  // Extract all route paths from App.tsx
  const routePaths = [...APP_SOURCE.matchAll(/path="([^"]+)"/g)].map((m) => m[1])

  it('has routes defined', () => {
    expect(routePaths.length).toBeGreaterThan(50)
  })

  it('has a catch-all 404 route', () => {
    expect(routePaths).toContain('*')
  })

  it('has dashboard route', () => {
    expect(routePaths).toContain('/dashboard')
  })

  it('has root redirect', () => {
    expect(routePaths).toContain('/')
  })

  // Core CRUD resources should have list + detail routes
  // Resources with standard list + detail /:id pattern
  const CRUD_RESOURCES = [
    'jobs',
    'projects',
    'inventories',
    'credentials',
    'organizations',
    'users',
    'teams',
    'hosts',
    'schedules',
  ]

  for (const resource of CRUD_RESOURCES) {
    it(`has list route for /${resource}`, () => {
      expect(routePaths).toContain(`/${resource}`)
    })

    it(`has detail route for /${resource}/:id`, () => {
      expect(routePaths).toContain(`/${resource}/:id`)
    })
  }

  // Templates use a different pattern: /templates/:type/:id
  it('has list route for /templates', () => {
    expect(routePaths).toContain('/templates')
  })

  it('has detail route for /templates/:type/:id', () => {
    expect(routePaths).toContain('/templates/:type/:id')
  })

  // Resources that should have create/edit forms
  const FORM_RESOURCES = [
    'projects',
    'inventories',
    'credentials',
    'organizations',
    'users',
    'teams',
    'schedules',
  ]

  for (const resource of FORM_RESOURCES) {
    it(`has new form route for /${resource}/new`, () => {
      expect(routePaths).toContain(`/${resource}/new`)
    })

    it(`has edit form route for /${resource}/:id/edit`, () => {
      expect(routePaths).toContain(`/${resource}/:id/edit`)
    })
  }

  // Advanced features
  const ADVANCED_ROUTES = [
    '/event_rules',
    '/event_logs',
    '/outbound_webhooks',
    '/drift_detections',
    '/drift_alert_rules',
    '/drift_alerts',
    '/fact_snapshots',
    '/analytics',
    '/service_portal',
    '/my_requests',
    '/service_catalog',
    '/policies',
    '/policy_decisions',
    '/scanners',
    '/scan_results',
    '/observability',
    '/tenants',
    '/tenant_quota_events',
    '/settings',
  ]

  for (const route of ADVANCED_ROUTES) {
    it(`has route for ${route}`, () => {
      expect(routePaths).toContain(route)
    })
  }

  // Wizard routes
  const WIZARD_ROUTES = [
    '/wizards/getting-started',
    '/wizards/automation',
    '/wizards/self-service',
    '/wizards/tenancy',
    '/wizards/compliance',
    '/wizards/resources',
    '/wizards/access',
  ]

  for (const route of WIZARD_ROUTES) {
    it(`has wizard route ${route}`, () => {
      expect(routePaths).toContain(route)
    })
  }

  // Auth routes
  it('has login route', () => {
    expect(routePaths).toContain('/login')
  })

  it('has security settings route', () => {
    expect(routePaths).toContain('/me/security')
  })

  it('has MFA challenge route', () => {
    expect(routePaths).toContain('/auth/mfa')
  })
})

describe('Route patterns', () => {
  const routePaths = [...APP_SOURCE.matchAll(/path="([^"]+)"/g)].map((m) => m[1]!)

  it('all paths start with / or are wildcard', () => {
    for (const p of routePaths) {
      expect(p === '*' || p.startsWith('/')).toBe(true)
    }
  })

  it('no trailing slashes (React Router convention)', () => {
    for (const p of routePaths) {
      if (p !== '/' && p !== '*') {
        expect(p.endsWith('/')).toBe(false)
      }
    }
  })

  it('detail routes use :id parameter', () => {
    const detailRoutes = routePaths.filter((p) => p.match(/\/\d/) === null && p.includes(':id'))
    expect(detailRoutes.length).toBeGreaterThan(10)
  })
})

describe('Page imports', () => {
  // Both forms count: static `from '@/...'` for the few modules the first paint
  // needs, and `import('@/...')` inside lazy() for everything routed.
  const imports = [
    ...[...APP_SOURCE.matchAll(/from\s+'(@\/[^']+)'/g)].map((m) => m[1]!),
    ...[...APP_SOURCE.matchAll(/import\('(@\/[^']+)'\)/g)].map((m) => m[1]!),
  ]

  it('has imports for all pages', () => {
    const pageImports = imports.filter((i) => i.includes('/pages/'))
    expect(pageImports.length).toBeGreaterThan(60)
  })

  it('loads pages lazily', () => {
    // Eagerly importing pages is what put 1.44 MB into the entry chunk, which
    // every visitor parses before the first screen. Login and ForcePasswordChange
    // are the deliberate exceptions -- they are that first screen.
    const EAGER_BY_DESIGN = ['Login', 'ForcePasswordChange']
    const eager = [...APP_SOURCE.matchAll(/^import \{ (\w+) \} from '@\/pages\/[\w/]+'/gm)].map((m) => m[1]!)
    expect(eager.sort()).toEqual(EAGER_BY_DESIGN.sort())
  })

  it('wraps the lazy routes in a Suspense boundary', () => {
    // Without one, the first navigation to a lazily loaded page throws.
    expect(APP_SOURCE).toContain('<Suspense')
  })

  it('imports layout components', () => {
    expect(imports.some((i) => i.includes('AppLayout'))).toBe(true)
  })

  it('imports auth hook', () => {
    expect(imports.some((i) => i.includes('useAuth'))).toBe(true)
  })

  it('imports theme store', () => {
    expect(imports.some((i) => i.includes('theme'))).toBe(true)
  })
})
