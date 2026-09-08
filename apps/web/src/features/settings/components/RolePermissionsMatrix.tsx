'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RolePermissionScopeSelect } from '@/features/settings/components/RolePermissionScopeSelect';
import {
  ROLE_PERMISSION_ACTIONS,
  formatRolePermissionModuleName,
  rolePermissionScopeKey,
  type RolePermissionDef,
  type RolePermissionScope,
} from '@/features/settings/components/role-permissions-types';

export function RolePermissionsMatrix(props: {
  allPermissions: RolePermissionDef[];
  matrixScopes: Record<string, RolePermissionScope>;
  onScopeChange: (module: string, action: string, scope: RolePermissionScope) => void;
}) {
  const modules = [...new Set(props.allPermissions.map((permission) => permission.module))].sort();
  const permissionMap = new Map<string, RolePermissionDef>();
  for (const permission of props.allPermissions) {
    permissionMap.set(rolePermissionScopeKey(permission.module, permission.action), permission);
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="bg-background sticky left-0 z-10 min-w-[180px]">Module</TableHead>
            {ROLE_PERMISSION_ACTIONS.map((action) => (
              <TableHead key={action} className="min-w-[120px]">
                {action}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.map((module) => (
            <TableRow key={module}>
              <TableCell className="bg-background sticky left-0 z-10 font-medium">
                {formatRolePermissionModuleName(module)}
              </TableCell>
              {ROLE_PERMISSION_ACTIONS.map((action) => {
                const key = rolePermissionScopeKey(module, action);
                const permission = permissionMap.get(key);
                const scope = props.matrixScopes[key] ?? 'NONE';
                return (
                  <TableCell key={action}>
                    {permission ? (
                      <RolePermissionScopeSelect
                        value={scope}
                        onValueChange={(next) => props.onScopeChange(module, action, next)}
                      />
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
  );
}
