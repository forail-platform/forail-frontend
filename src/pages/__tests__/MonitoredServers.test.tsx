import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError, AxiosHeaders } from 'axios'
import type { MonitoredServer, MonitoredServerCapabilities, ObjectRole } from '@/api/types'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  detail: vi.fn(),
  create: vi.fn(),
  issue: vi.fn(),
  rotate: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('@/api/hooks/useMonitoredServers', () => ({
  useMonitoredServers: () => mocks.list(),
  useMonitoredServer: () => mocks.detail(),
  useCreateMonitoredServer: () => ({ mutate: mocks.create, isPending: false }),
  useIssueEnrollmentCode: () => ({ mutate: mocks.issue, isPending: false }),
  useRotateAgentToken: () => ({ mutate: mocks.rotate, isPending: false }),
  useDeleteMonitoredServer: () => ({ mutate: mocks.remove, isPending: false }),
}))

vi.mock('@/api/hooks/useOrganizations', () => ({
  useOrganizations: () => ({ data: { count: 2, results: [{ id: 1, name: 'org-1' }, { id: 2, name: 'org-2' }] } }),
}))

vi.mock('@/api/hooks/useRoles', () => ({
  useRoleUsers: () => ({ data: { count: 1, results: [{ id: 7, username: 'user-b', first_name: '', last_name: '' }] } }),
  useRoleTeams: () => ({ data: { count: 0, results: [] } }),
  useAssignRoleUser: () => ({ mutate: vi.fn() }),
  useUnassignRoleUser: () => ({ mutate: vi.fn() }),
  useAssignRoleTeam: () => ({ mutate: vi.fn() }),
  useUnassignRoleTeam: () => ({ mutate: vi.fn() }),
}))

vi.mock('@/api/hooks/useUsers', () => ({ useUsers: () => ({ data: { results: [] } }) }))
vi.mock('@/api/hooks/useTeams', () => ({ useTeams: () => ({ data: { results: [] } }) }))

import { MonitoredServers } from '../MonitoredServers'
import { MonitoredServerDetail } from '../MonitoredServerDetail'
import { MonitoredServerForm, createErrorMessage } from '../MonitoredServerForm'

const roles: Record<string, ObjectRole> = {
  admin_role: { id: 11, name: 'Admin', description: 'Can manage all aspects of the monitored server' },
  read_role: { id: 12, name: 'Read', description: 'May view settings for the monitored server' },
}

function server(caps: MonitoredServerCapabilities, extra: Partial<MonitoredServer> = {}): MonitoredServer {
  return {
    id: 5,
    type: 'monitored_server',
    url: '/api/v2/monitored_servers/5/',
    name: 'web-01',
    description: '',
    organization: 1,
    owner: 3,
    mobile_server_id: '8b1f4c3e-0000-4000-8000-000000000001',
    online: true,
    last_report_at: '2026-11-12T09:59:00Z',
    created: '2026-11-12T09:00:00Z',
    modified: '2026-11-12T09:00:00Z',
    summary_fields: {
      organization: { id: 1, name: 'org-1' },
      owner: { id: 3, username: 'user-a', first_name: '', last_name: '' },
      object_roles: roles,
      user_capabilities: caps,
    },
    ...extra,
  }
}

const OWNER = { edit: true, delete: true, rotate: true, manage_access: false }
const ORG_ADMIN = { edit: true, delete: true, rotate: true, manage_access: true }
const READER = { edit: false, delete: false, rotate: false, manage_access: false }

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/monitored_servers" element={<MonitoredServers />} />
          <Route path="/monitored_servers/new" element={<MonitoredServerForm />} />
          <Route path="/monitored_servers/:id" element={<MonitoredServerDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset())
})

describe('Monitored servers list', () => {
  it('shows name, status, organization and owner', () => {
    mocks.list.mockReturnValue({ data: { count: 2, results: [server(OWNER), server(OWNER, { id: 6, name: 'db-01', online: false })] }, isLoading: false })
    renderAt('/monitored_servers')
    expect(screen.getByText('web-01')).toBeInTheDocument()
    expect(screen.getByText('online')).toBeInTheDocument()
    expect(screen.getByText('offline')).toBeInTheDocument()
    expect(screen.getAllByText('org-1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('user-a').length).toBeGreaterThan(0)
  })

  it('has an empty state that leads to registering', () => {
    mocks.list.mockReturnValue({ data: { count: 0, results: [] }, isLoading: false })
    renderAt('/monitored_servers')
    expect(screen.getByTestId('empty-state')).toHaveTextContent('No monitored servers yet')
  })

  it('says when Forail Mobile cannot be reached', () => {
    mocks.list.mockReturnValue({ data: { count: 1, results: [server(OWNER, { online: null })] }, isLoading: false })
    renderAt('/monitored_servers')
    expect(screen.getByTestId('mobile-unreachable')).toBeInTheDocument()
    expect(screen.getByText('unknown')).toBeInTheDocument()
  })
})

describe('Monitored server detail', () => {
  it('shows management buttons by user_capabilities', () => {
    mocks.detail.mockReturnValue({ data: server(READER), isLoading: false })
    const { unmount } = renderAt('/monitored_servers/5')
    expect(screen.queryByRole('button', { name: /rotate token/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
    unmount()

    mocks.detail.mockReturnValue({ data: server(OWNER), isLoading: false })
    renderAt('/monitored_servers/5')
    expect(screen.getByRole('button', { name: /rotate token/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })

  it('opens on the install panel after registering', () => {
    mocks.detail.mockReturnValue({ data: server(OWNER), isLoading: false })
    renderAt('/monitored_servers/5?install=1')
    expect(screen.getByTestId('install-panel')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /issue enrollment code/i }))
    expect(mocks.issue).toHaveBeenCalled()
  })

  it('rotation asks first, then shows the new code in the install panel', () => {
    mocks.detail.mockReturnValue({ data: server(OWNER), isLoading: false })
    mocks.rotate.mockImplementation((_: unknown, opts: { onSuccess: (c: unknown) => void }) =>
      opts.onSuccess({ code: 'fme_new', expires_at: new Date(Date.now() + 600_000).toISOString(), api_url: 'x', command: 'sudo forail-agent enroll --api x --code fme_new' }),
    )
    renderAt('/monitored_servers/5')
    fireEvent.click(screen.getByRole('button', { name: /rotate token/i }))
    expect(mocks.rotate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /^rotate$/i }))
    expect(mocks.rotate).toHaveBeenCalled()
    expect(screen.getByTestId('install-command')).toHaveTextContent('fme_new')
  })

  it('the owner sees the access list but cannot change it', () => {
    mocks.detail.mockReturnValue({ data: server(OWNER), isLoading: false })
    renderAt('/monitored_servers/5')
    fireEvent.click(screen.getByRole('tab', { name: /access/i }))
    expect(screen.getByText(/only the admins of this server/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Read'))
    expect(screen.getByText('user-b')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^add$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remove user-b/i })).not.toBeInTheDocument()
  })

  it('an organization admin can grant and revoke', () => {
    mocks.detail.mockReturnValue({ data: server(ORG_ADMIN), isLoading: false })
    renderAt('/monitored_servers/5')
    fireEvent.click(screen.getByRole('tab', { name: /access/i }))
    fireEvent.click(screen.getByText('Read'))
    expect(screen.getAllByRole('button', { name: /^add$/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /remove user-b/i })).toBeInTheDocument()
  })

  it('a server the user may not see is not found', () => {
    mocks.detail.mockReturnValue({ data: undefined, isLoading: false })
    renderAt('/monitored_servers/99')
    expect(screen.getByText('Monitored server not found.')).toBeInTheDocument()
  })
})

function axiosError(status: number, data: unknown) {
  return new AxiosError('Request failed', 'ERR', undefined, undefined, {
    status,
    data,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  })
}

describe('Registering a server', () => {
  it('refuses a name the platform would refuse, before asking it', () => {
    renderAt('/monitored_servers/new')
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'web 01;' } })
    fireEvent.change(screen.getByLabelText(/organization/i), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: /register/i }))
    expect(mocks.create).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/letters, digits/)
  })

  it('sends name and organization and shows the reason it failed', async () => {
    mocks.create.mockImplementation((_: unknown, opts: { onError: (e: unknown) => void }) =>
      opts.onError(axiosError(409, { detail: 'You already own 10 monitored servers, the most one user may register.' })),
    )
    renderAt('/monitored_servers/new')
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'web-01' } })
    fireEvent.change(screen.getByLabelText(/organization/i), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: /register/i }))
    expect(mocks.create.mock.calls[0]?.[0]).toEqual({ name: 'web-01', organization: 2, description: '' })
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('most one user may register'))
  })

  it('explains duplicate names, quota and an unavailable mobile backend', () => {
    expect(createErrorMessage(axiosError(400, { __all__: ['Monitored server with this Organization and Name already exists.'] }))).toMatch(/already exists in this organization/)
    expect(createErrorMessage(axiosError(400, { non_field_errors: ['The fields organization, name must make a unique set.'] }))).toMatch(/already exists in this organization/)
    expect(createErrorMessage(axiosError(409, {}))).toMatch(/number of servers/)
    expect(createErrorMessage(axiosError(503, { detail: 'down' }))).toMatch(/Forail Mobile is not available/)
    expect(createErrorMessage(axiosError(403, {}))).toMatch(/organization you belong to/)
  })
})
