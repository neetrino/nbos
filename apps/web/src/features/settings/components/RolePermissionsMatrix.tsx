'use client';

import { RolePermissionGroupCard } from '@/features/settings/components/RolePermissionGroupCard';
import { groupRolePermissionModules } from '@/features/settings/components/role-permission-groups';
import {
  rolePermissionScopeKey,
  type RolePermissionDef,
  type RolePermissionScope,
} from '@/features/settings/components/role-permissions-types';

export function RolePermissionsMatrix(props: {
  allPermissions: RolePermissionDef[];
  matrixScopes: Record<string, RolePermissionScope>;
  query: string;
  onScopeChange: (module: string, action: string, scope: RolePermissionScope) => void;
}) {
  const modules = [...new Set(props.allPermissions.map((permission) => permission.module))];
  const groups = groupRolePermissionModules(modules, props.query);
  const permissionMap = buildPermissionMap(props.allPermissions);

  if (groups.length === 0) {
    return <p className="text-muted-foreground text-sm">No modules match this search.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <RolePermissionGroupCard
          key={group.id}
          groupId={group.id}
          title={group.title}
          modules={group.modules}
          permissionMap={permissionMap}
          matrixScopes={props.matrixScopes}
          onScopeChange={props.onScopeChange}
        />
      ))}
    </div>
  );
}

function buildPermissionMap(allPermissions: RolePermissionDef[]): Map<string, RolePermissionDef> {
  const permissionMap = new Map<string, RolePermissionDef>();
  for (const permission of allPermissions) {
    permissionMap.set(rolePermissionScopeKey(permission.module, permission.action), permission);
  }
  return permissionMap;
}
