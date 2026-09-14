'use client';

import { Archive, ChevronRight, RotateCcw, Users } from 'lucide-react';
import { SETTINGS_RBAC_MODULE } from '@nbos/shared/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PermissionGate } from '@/lib/permissions';
import type { RoleListItem } from './role-permissions-types';

export function RolesTable({
  roles,
  busyRoleId,
  onSelect,
  onArchive,
  onRestore,
}: {
  roles: RoleListItem[];
  busyRoleId: string | null;
  onSelect: (role: RoleListItem) => void;
  onArchive: (role: RoleListItem) => void;
  onRestore: (role: RoleListItem) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="w-20">Level</TableHead>
          <TableHead className="w-24">System</TableHead>
          <TableHead className="w-24">Employees</TableHead>
          <TableHead className="w-28" />
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((role) => (
          <TableRow
            key={role.id}
            className="hover:bg-muted/50 cursor-pointer"
            onClick={() => onSelect(role)}
          >
            <TableCell className="font-medium">
              <span className="flex items-center gap-2">
                {role.name}
                {role.archivedAt ? <Badge variant="outline">Archived</Badge> : null}
              </span>
            </TableCell>
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
            <TableCell>
              <RoleRetirementAction
                role={role}
                busy={busyRoleId === role.id}
                onArchive={onArchive}
                onRestore={onRestore}
              />
            </TableCell>
            <TableCell className="text-muted-foreground">
              <ChevronRight size={16} aria-hidden />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RoleRetirementAction({
  role,
  busy,
  onArchive,
  onRestore,
}: {
  role: RoleListItem;
  busy: boolean;
  onArchive: (role: RoleListItem) => void;
  onRestore: (role: RoleListItem) => void;
}) {
  if (role.isSystem) return null;
  const archived = Boolean(role.archivedAt);
  return (
    <PermissionGate module={SETTINGS_RBAC_MODULE} action={archived ? 'EDIT' : 'DELETE'}>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={busy}
        onClick={(event) => {
          event.stopPropagation();
          if (archived) onRestore(role);
          else onArchive(role);
        }}
      >
        {archived ? <RotateCcw size={14} aria-hidden /> : <Archive size={14} aria-hidden />}
        {archived ? 'Restore' : 'Archive'}
      </Button>
    </PermissionGate>
  );
}
