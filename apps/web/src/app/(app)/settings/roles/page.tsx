'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Plus, Shield, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, LoadingState, PageHero } from '@/components/shared';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { PermissionGate } from '@/lib/permissions';
import { CreateRoleDialog } from '@/features/settings/components/CreateRoleDialog';
import { RolePermissionsSheet } from '@/features/settings/components/RolePermissionsSheet';
import {
  buildRoleMatrixScopes,
  rolePermissionScopeKey,
  type RoleListItem,
  type RolePermissionDef,
  type RolePermissionScope,
  type RoleWithPermissions,
} from '@/features/settings/components/role-permissions-types';

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [allPermissions, setAllPermissions] = useState<RolePermissionDef[]>([]);
  const [openRoleId, setOpenRoleId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [matrixScopes, setMatrixScopes] = useState<Record<string, RolePermissionScope>>({});
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingRole, setLoadingRole] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createLevel, setCreateLevel] = useState(10);
  const [createSaving, setCreateSaving] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const data = await api.get<RoleListItem[]>('/api/roles').then((r) => r.data);
      setRoles(Array.isArray(data) ? data : []);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load roles');
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const data = await api.get<RolePermissionDef[]>('/api/permissions').then((r) => r.data);
      setAllPermissions(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load permissions');
      setAllPermissions([]);
    }
  }, []);

  const fetchRoleById = useCallback(async (id: string, catalog: RolePermissionDef[]) => {
    setLoadingRole(true);
    try {
      const data = await api.get<RoleWithPermissions>(`/api/roles/${id}`).then((r) => r.data);
      setSelectedRole(data);
      setMatrixScopes(buildRoleMatrixScopes(data.permissions ?? [], catalog));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load role');
      setSelectedRole(null);
    } finally {
      setLoadingRole(false);
    }
  }, []);

  useEffect(() => {
    void fetchRoles();
    void fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  useEffect(() => {
    if (!selectedRole || allPermissions.length === 0) return;
    setMatrixScopes((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const permission of allPermissions) {
        const key = rolePermissionScopeKey(permission.module, permission.action);
        if (!(key in next)) {
          next[key] = 'NONE';
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [allPermissions, selectedRole]);

  const handleSelectRole = (role: RoleListItem) => {
    setSaveConfirmOpen(false);
    setOpenRoleId(role.id);
    setSelectedRole(null);
    void fetchRoleById(role.id, allPermissions);
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (open) return;
    setOpenRoleId(null);
    setSelectedRole(null);
    setSaveConfirmOpen(false);
  };

  const handleSavePermissions = async (): Promise<boolean> => {
    if (!selectedRole) return false;
    setSaving(true);
    try {
      const permissions = allPermissions
        .filter((permission) => {
          const scope = matrixScopes[rolePermissionScopeKey(permission.module, permission.action)];
          return scope && scope !== 'NONE';
        })
        .map((permission) => ({
          permissionId: permission.id,
          scope:
            matrixScopes[rolePermissionScopeKey(permission.module, permission.action)] ?? 'NONE',
        }));
      await api.put(`/api/roles/${selectedRole.id}/permissions`, { permissions });
      toast.success('Permissions saved');
      const data = await api
        .get<RoleWithPermissions>(`/api/roles/${selectedRole.id}`)
        .then((r) => r.data);
      setSelectedRole(data);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save permissions');
      return false;
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
      void fetchRoles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create role');
    } finally {
      setCreateSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHero
        title="Roles"
        trailing={
          <PermissionGate module="COMPANY" action="ADD">
            <Button type="button" size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus size={16} aria-hidden />
              Create Role
            </Button>
          </PermissionGate>
        }
      />
      <p className="text-muted-foreground text-sm">
        Click a role to open its permissions and change access.
      </p>

      <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-4">
        <h3 className="text-foreground flex items-center gap-2 text-sm font-medium">
          <Shield size={16} />
          Roles
        </h3>
        {loadError ? (
          <ErrorState
            description={loadError}
            onRetry={() => {
              void fetchRoles();
              void fetchPermissions();
            }}
          />
        ) : loadingRoles ? (
          <LoadingState count={3} />
        ) : roles.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No roles configured"
            description="Create a role before editing permissions."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-20">Level</TableHead>
                <TableHead className="w-24">System</TableHead>
                <TableHead className="w-24">Employees</TableHead>
                <TableHead className="w-10" />
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
                  <TableCell className="text-muted-foreground">
                    <ChevronRight size={16} aria-hidden />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <RolePermissionsSheet
        open={openRoleId !== null}
        role={selectedRole}
        loading={loadingRole}
        saving={saving}
        saveConfirmOpen={saveConfirmOpen}
        allPermissions={allPermissions}
        matrixScopes={matrixScopes}
        onOpenChange={handleSheetOpenChange}
        onScopeChange={(module, action, scope) => {
          setMatrixScopes((prev) => ({ ...prev, [rolePermissionScopeKey(module, action)]: scope }));
        }}
        onSaveConfirmOpenChange={setSaveConfirmOpen}
        onConfirmSave={async () => {
          const saved = await handleSavePermissions();
          if (saved) setSaveConfirmOpen(false);
        }}
      />

      <CreateRoleDialog
        open={createDialogOpen}
        name={createName}
        slug={createSlug}
        level={createLevel}
        saving={createSaving}
        onOpenChange={setCreateDialogOpen}
        onNameChange={(name) => {
          setCreateName(name);
          if (!createSlug) setCreateSlug(name.trim().toLowerCase().replace(/\s+/g, '-'));
        }}
        onSlugChange={setCreateSlug}
        onLevelChange={setCreateLevel}
        onCreate={() => void handleCreateRole()}
      />
    </div>
  );
}
