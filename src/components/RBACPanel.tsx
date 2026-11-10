import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Plus, Users, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  useRoleUsers,
  useRoleTeams,
  useAssignRoleUser,
  useUnassignRoleUser,
  useAssignRoleTeam,
  useUnassignRoleTeam,
} from '@/api/hooks/useRoles'
import { useUsers } from '@/api/hooks/useUsers'
import { useTeams } from '@/api/hooks/useTeams'
import type { ObjectRole } from '@/api/types'

interface RBACPanelProps {
  objectRoles: Record<string, ObjectRole> | undefined
  /** Show who holds each role, without the add and remove controls. */
  readOnly?: boolean
  /** Shown under the title, e.g. who may change access. */
  note?: string
}

export function RBACPanel({ objectRoles, readOnly = false, note }: RBACPanelProps) {
  const [selectedRole, setSelectedRole] = useState<ObjectRole | null>(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showAddTeam, setShowAddTeam] = useState(false)

  if (!objectRoles || Object.keys(objectRoles).length === 0) {
    return null
  }

  const roles = Object.entries(objectRoles).map(([key, role]) => ({
    ...role,
    key,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Permissions
        </CardTitle>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {roles.map((role) => (
          <RoleSection
            key={role.key}
            role={role}
            readOnly={readOnly}
            isSelected={selectedRole?.id === role.id}
            onSelect={() => setSelectedRole(selectedRole?.id === role.id ? null : role)}
            onAddUser={() => { setSelectedRole(role); setShowAddUser(true) }}
            onAddTeam={() => { setSelectedRole(role); setShowAddTeam(true) }}
          />
        ))}

        {selectedRole && !readOnly && (
          <>
            <AddUserDialog
              open={showAddUser}
              onOpenChange={setShowAddUser}
              roleId={selectedRole.id}
            />
            <AddTeamDialog
              open={showAddTeam}
              onOpenChange={setShowAddTeam}
              roleId={selectedRole.id}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}

function RoleSection({
  role,
  readOnly,
  isSelected,
  onSelect,
  onAddUser,
  onAddTeam,
}: {
  role: ObjectRole & { key: string }
  readOnly: boolean
  isSelected: boolean
  onSelect: () => void
  onAddUser: () => void
  onAddTeam: () => void
}) {
  const { data: usersData } = useRoleUsers(isSelected ? role.id : undefined)
  const { data: teamsData } = useRoleTeams(isSelected && !role.user_only ? role.id : undefined)
  const unassignUser = useUnassignRoleUser(role.id)
  const unassignTeam = useUnassignRoleTeam(role.id)

  return (
    <div className="rounded-md border">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-muted/50"
        onClick={onSelect}
      >
        <div>
          <span className="font-medium">{role.name}</span>
          <p className="text-xs text-muted-foreground">{role.description}</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {isSelected ? 'Collapse' : 'Expand'}
        </Badge>
      </button>

      {isSelected && (
        <div className="border-t px-4 py-3 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Users</span>
              {!readOnly && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onAddUser}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Button>
              )}
            </div>
            {usersData && usersData.results.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {usersData.results.map((u) => (
                  <Badge key={u.id} variant="secondary" className="gap-1 pr-1">
                    <Link to={`/users/${u.id}`} className="hover:underline">
                      {u.username}
                    </Link>
                    {!readOnly && (
                      <button
                        type="button"
                        aria-label={`Remove ${u.username}`}
                        onClick={() => unassignUser.mutate(u.id)}
                        className="ml-0.5 rounded hover:bg-muted-foreground/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No users assigned</p>
            )}
          </div>

          {!role.user_only && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Teams</span>
                {!readOnly && (
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onAddTeam}>
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                )}
              </div>
              {teamsData && teamsData.results.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {teamsData.results.map((t) => (
                    <Badge key={t.id} variant="secondary" className="gap-1 pr-1">
                      <Link to={`/teams/${t.id}`} className="hover:underline">
                        {t.name}
                      </Link>
                      {!readOnly && (
                        <button
                          type="button"
                          aria-label={`Remove ${t.name}`}
                          onClick={() => unassignTeam.mutate(t.id)}
                          className="ml-0.5 rounded hover:bg-muted-foreground/20 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No teams assigned</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AddUserDialog({
  open,
  onOpenChange,
  roleId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  roleId: number
}) {
  const [search, setSearch] = useState('')
  const { data: usersData } = useUsers({ search: search || undefined, page_size: 10 })
  const assign = useAssignRoleUser(roleId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add User to Role
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {usersData?.results.map((u) => (
              <button
                key={u.id}
                type="button"
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
                onClick={() => {
                  assign.mutate(u.id, { onSuccess: () => onOpenChange(false) })
                }}
              >
                <span className="font-medium">{u.username}</span>
                {(u.first_name || u.last_name) && (
                  <span className="text-muted-foreground">
                    {[u.first_name, u.last_name].filter(Boolean).join(' ')}
                  </span>
                )}
              </button>
            ))}
            {usersData?.results.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddTeamDialog({
  open,
  onOpenChange,
  roleId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  roleId: number
}) {
  const [search, setSearch] = useState('')
  const { data: teamsData } = useTeams({ search: search || undefined, page_size: 10 })
  const assign = useAssignRoleTeam(roleId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add Team to Role
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {teamsData?.results.map((t) => (
              <button
                key={t.id}
                type="button"
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
                onClick={() => {
                  assign.mutate(t.id, { onSuccess: () => onOpenChange(false) })
                }}
              >
                <span className="font-medium">{t.name}</span>
                {t.description && (
                  <span className="text-muted-foreground truncate">{t.description}</span>
                )}
              </button>
            ))}
            {teamsData?.results.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No teams found</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
