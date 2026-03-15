'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Save, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PermissionGate } from '@/lib/permissions';

const SCOPE_OPTIONS = ['NONE', 'OWN', 'DEPARTMENT', 'ALL'] as const;
type Scope = (typeof SCOPE_OPTIONS)[number];

const ACTIONS = ['VIEW', 'EDIT', 'ADD', 'DELETE'] as const;

interface RoleItem {
  id: string;
  name: string;
  slug: string;
  level: number;
  isSystem: boolean;
  _count?: { employees: number };
}

interface Permission {
  id: string;
  module: string;
  action: string;
  description?: string | null;
}

interface RolePermission {
  id: string;
  permissionId: string;
  scope: string;
  permission: Permission;
}

interface RoleWithPermissions extends RoleItem {
  permissions: RolePermission[];
}

function formatModuleName(module: string): string {
  return module.replace(/_/g, ' ');
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [matrixScopes, setMatrixScopes] = useState<Record<string, Scope>>({});
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [loadingRole, setLoadingRole] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createLevel, setCreateLevel] = useState(10);
  const [createSaving, setCreateSaving] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const data = await api.get<RoleItem[]>('/api/roles').then((r) => r.data);
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load roles');
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    setLoadingPermissions(true);
    try {
      const data = await api.get<Permission[]>('/api/permissions').then((r) => r.data);
      setAllPermissions(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load permissions');
      setAllPermissions([]);
    } finally {
      setLoadingPermissions(false);
    }
  }, []);

  const fetchRoleById = useCallback(
    async (id: string) => {
      setLoadingRole(true);
      try {
        const data = await api.get<RoleWithPermissions>(`/api/roles/${id}`).then((r) => r.data);
        setSelectedRole(data);

        const scopes: Record<string, Scope> = {};
        for (const rp of data.permissions ?? []) {
          const key = `${rp.permission.module}:${rp.permission.action}`;
          scopes[key] = (rp.scope as Scope) || 'NONE';
        }
        for (const p of allPermissions) {
          const key = `${p.module}:${p.action}`;
          if (!(key in scopes)) scopes[key] = 'NONE';
        }
        setMatrixScopes(scopes);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load role');
        setSelectedRole(null);
      } finally {
        setLoadingRole(false);
      }
    },
    [allPermissions],
  );

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  useEffect(() => {
    if (!selectedRole || allPermissions.length === 0) return;
    setMatrixScopes((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const p of allPermissions) {
        const key = `${p.module}:${p.action}`;
        if (!(key in next)) {
          next[key] = 'NONE';
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [selectedRole, allPermissions]);

  const handleSelectRole = (role: RoleItem) => {
    setSelectedRole(null);
    fetchRoleById(role.id);
  };

  const handleScopeChange = (
    permissionId: string,
    module: string,
    action: string,
    scope: Scope,
  ) => {
    const key = `${module}:${action}`;
    setMatrixScopes((prev) => ({ ...prev, [key]: scope }));
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const permissions = allPermissions
        .filter((p) => {
          const key = `${p.module}:${p.action}`;
          const scope = matrixScopes[key] ?? 'NONE';
          return scope !== 'NONE';
        })
        .map((p) => {
          const key = `${p.module}:${p.action}`;
          const scope = matrixScopes[key] ?? 'NONE';
          return { permissionId: p.id, scope };
        });

      await api.put(`/api/roles/${selectedRole.id}/permissions`, { permissions });
      toast.success('Permissions saved');
      const data = await api
        .get<RoleWithPermissions>(`/api/roles/${selectedRole.id}`)
        .then((r) => r.data);
      setSelectedRole(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async () => {
    const name = createName.trim();
    const slug = createSlug.trim().toLowerCase().replace(/\s+/g, '-');
    if (!name || !slug) {
      toast.error('Name and slug are required');
      return;
    }
    setCreateSaving(true);
    try {
      await api.post('/api/roles', { name, slug, level: createLevel });
      toast.success('Role created');
      setCreateDialogOpen(false);
      setCreateName('');
      setCreateSlug('');
      setCreateLevel(10);
      fetchRoles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create role');
    } finally {
      setCreateSaving(false);
    }
  };

  const modules = [...new Set(allPermissions.map((p) => p.module))].sort();
  const permissionMap = new Map<string, Permission>();
  for (const p of allPermissions) {
    permissionMap.set(`${p.module}:${p.action}`, p);
  }

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader
        title="Roles"
        description="RBAC Admin Panel — manage roles and their permissions."
      >
        <PermissionGate module="COMPANY" action="ADD">
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus size={16} />
            Create Role
          </Button>
        </PermissionGate>
      </PageHeader>

      <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-4">
        <h3 className="text-foreground flex items-center gap-2 text-sm font-medium">
          <Shield size={16} />
          Roles
        </h3>
        {loadingRoles ? (
          <div className="text-muted-foreground text-sm">Loading roles...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-20">Level</TableHead>
                <TableHead className="w-24">System</TableHead>
                <TableHead className="w-24">Employees</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow
                  key={role.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleSelectRole(role)}
                >
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.level}</TableCell>
                  <TableCell>
                    {role.isSystem ? (
                      <Badge variant="secondary">System</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-sm">
                      <Users size={14} />
                      {role._count?.employees ?? 0}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {selectedRole && (
        <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground flex items-center gap-2 text-sm font-medium">
              <Shield size={16} />
              Permissions — {selectedRole.name}
            </h3>
            {!selectedRole.isSystem && (
              <Button size="sm" onClick={handleSavePermissions} disabled={saving}>
                <Save size={16} />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>

          {loadingRole ? (
            <div className="text-muted-foreground text-sm">Loading permissions...</div>
          ) : loadingPermissions ? (
            <div className="text-muted-foreground text-sm">Loading permission matrix...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-background sticky left-0 z-10 min-w-[180px]">
                      Module
                    </TableHead>
                    {ACTIONS.map((a) => (
                      <TableHead key={a} className="min-w-[120px]">
                        {a}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module) => (
                    <TableRow key={module}>
                      <TableCell className="bg-background sticky left-0 z-10 font-medium">
                        {formatModuleName(module)}
                      </TableCell>
                      {ACTIONS.map((action) => {
                        const perm = permissionMap.get(`${module}:${action}`);
                        const key = `${module}:${action}`;
                        const scope = (matrixScopes[key] ?? 'NONE') as Scope;
                        return (
                          <TableCell key={action}>
                            {perm ? (
                              <Select
                                value={scope}
                                onValueChange={(v) =>
                                  handleScopeChange(perm.id, module, action, v as Scope)
                                }
                                disabled={selectedRole.isSystem}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SCOPE_OPTIONS.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(e) => {
                  setCreateName(e.target.value);
                  if (!createSlug)
                    setCreateSlug(e.target.value.trim().toLowerCase().replace(/\s+/g, '-'));
                }}
                placeholder="e.g. Custom Manager"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-slug">Slug</Label>
              <Input
                id="create-slug"
                value={createSlug}
                onChange={(e) => setCreateSlug(e.target.value)}
                placeholder="e.g. custom-manager"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-level">Level</Label>
              <Input
                id="create-level"
                type="number"
                value={createLevel}
                onChange={(e) => setCreateLevel(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={createSaving}>
              {createSaving ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
