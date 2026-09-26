'use client';

import { useState } from 'react';
import { Archive, Plus, RotateCcw, Search, Shield, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SETTINGS_RBAC_MODULE } from '@nbos/shared/constants';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import { PermissionGate } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import type { RoleListItem } from './role-permissions-types';

const ROLE_COLUMNS =
  'grid grid-cols-[minmax(8rem,1.15fr)_repeat(4,minmax(4.25rem,0.72fr))] items-center gap-x-3 px-1';

export function RolesBoard({
  roles,
  busyRoleId,
  onSelect,
  onArchive,
  onRestore,
  onCreate,
}: {
  roles: RoleListItem[];
  busyRoleId: string | null;
  onSelect: (role: RoleListItem) => void;
  onArchive: (role: RoleListItem) => void;
  onRestore: (role: RoleListItem) => void;
  onCreate: () => void;
}) {
  const [query, setQuery] = useState('');
  const ordered = sortRoles(roles).filter((role) => matchesRoleQuery(role, query));

  return (
    <section className="border-border bg-card relative overflow-hidden rounded-2xl border p-4">
      <div className="bg-primary/15 pointer-events-none absolute -top-12 -right-8 size-28 rounded-full blur-2xl" />
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Shield size={15} />
          </div>
          <h2 className="text-foreground text-sm font-semibold">Roles</h2>
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
            {roles.length}
          </span>
        </div>
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={query}
            placeholder="Search roles"
            className="h-9 pl-9"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <PermissionGate module={SETTINGS_RBAC_MODULE} action="ADD">
          <Button
            type="button"
            size="icon"
            className="size-8 rounded-full"
            aria-label="Create role"
            onClick={onCreate}
          >
            <Plus size={16} aria-hidden />
          </Button>
        </PermissionGate>
      </div>
      {ordered.length === 0 ? (
        <p className="text-muted-foreground relative mt-4 text-sm">
          {query.trim() ? 'No roles match this search.' : 'No roles yet.'}
        </p>
      ) : (
        <div className="relative mt-4 overflow-x-auto">
          <div>
            <RoleColumnHeader />
            <ul className="mt-1 flex flex-col">
              {ordered.map((role) => (
                <RoleRow
                  key={role.id}
                  role={role}
                  busy={busyRoleId === role.id}
                  onSelect={onSelect}
                  onArchive={onArchive}
                  onRestore={onRestore}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

function RoleColumnHeader() {
  return (
    <div className={cn(ROLE_COLUMNS, 'text-muted-foreground pb-2 text-xs font-medium')}>
      <span>Role</span>
      <span>Level</span>
      <span>People</span>
      <span>Status</span>
      <span>Action</span>
    </div>
  );
}

function RoleRow({
  role,
  busy,
  onSelect,
  onArchive,
  onRestore,
}: {
  role: RoleListItem;
  busy: boolean;
  onSelect: (role: RoleListItem) => void;
  onArchive: (role: RoleListItem) => void;
  onRestore: (role: RoleListItem) => void;
}) {
  const archived = Boolean(role.archivedAt);
  const people = role._count?.employees ?? 0;

  return (
    <li
      className={cn(
        ROLE_COLUMNS,
        'border-border/70 hover:bg-muted/50 border-b py-2 transition-colors last:border-b-0',
        archived && 'opacity-60',
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(role)}
        className="col-span-4 grid grid-cols-subgrid items-center py-1 text-left"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
            <Shield size={18} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="text-foreground block truncate text-base font-medium">
              {role.name}
            </span>
            <span className="text-muted-foreground block truncate text-sm">{role.slug}</span>
          </span>
        </span>
        <span className="text-foreground text-base font-semibold tabular-nums">L{role.level}</span>
        <span className="text-foreground flex items-center gap-2">
          <Users size={18} className="text-primary" aria-hidden />
          <span className="text-lg font-semibold tabular-nums">{people}</span>
        </span>
        <RoleStatus role={role} />
      </button>
      <RoleActionCell
        system={role.isSystem}
        archived={archived}
        busy={busy}
        onClick={() => (archived ? onRestore(role) : onArchive(role))}
      />
    </li>
  );
}

function RoleStatus({ role }: { role: RoleListItem }) {
  if (role.archivedAt) return <StatusBadge label="Archived" variant="gray" className="shrink-0" />;
  if (role.isSystem) return <StatusBadge label="System" variant="blue" className="shrink-0" />;
  return <StatusBadge label="Active" variant="green" className="shrink-0" />;
}

function RoleActionCell({
  system,
  archived,
  busy,
  onClick,
}: {
  system: boolean;
  archived: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  if (system) {
    return <span className="text-muted-foreground text-sm">No action</span>;
  }
  return (
    <PermissionGate module={SETTINGS_RBAC_MODULE} action={archived ? 'EDIT' : 'DELETE'}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 w-fit justify-self-start px-2.5"
        disabled={busy}
        onClick={onClick}
      >
        {archived ? <RotateCcw size={14} aria-hidden /> : <Archive size={14} aria-hidden />}
        {archived ? 'Restore' : 'Archive'}
      </Button>
    </PermissionGate>
  );
}

function matchesRoleQuery(role: RoleListItem, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return role.name.toLowerCase().includes(needle) || role.slug.toLowerCase().includes(needle);
}

function sortRoles(roles: RoleListItem[]): RoleListItem[] {
  return [...roles].sort((left, right) => {
    if (left.level !== right.level) return left.level - right.level;
    return left.name.localeCompare(right.name);
  });
}
