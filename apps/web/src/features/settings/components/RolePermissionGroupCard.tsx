'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Folder,
  Handshake,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Truck,
  Wallet,
} from 'lucide-react';
import { InsightSheetSection } from '@/components/shared/InsightSheetSection';
import {
  ROLE_PERMISSION_SCOPE_CONTROL_CLASS,
  RolePermissionScopeSelect,
} from '@/features/settings/components/RolePermissionScopeSelect';
import { cn } from '@/lib/utils';
import {
  ROLE_PERMISSION_ACTIONS,
  formatRolePermissionModuleName,
  rolePermissionScopeKey,
  type RolePermissionDef,
  type RolePermissionScope,
} from '@/features/settings/components/role-permissions-types';

const ROW_GRID =
  'grid grid-cols-[minmax(9rem,1.45fr)_repeat(4,minmax(8.75rem,1fr))] items-center gap-x-6 px-1';

const GROUP_ICONS: Record<string, LucideIcon> = {
  sales: Handshake,
  finance: Wallet,
  work: ListChecks,
  delivery: Truck,
  files: Folder,
  messages: MessageSquare,
  company: Building2,
  platform: LayoutDashboard,
};

export function RolePermissionGroupCard(props: {
  groupId: string;
  title: string;
  modules: string[];
  permissionMap: Map<string, RolePermissionDef>;
  matrixScopes: Record<string, RolePermissionScope>;
  onScopeChange: (module: string, action: string, scope: RolePermissionScope) => void;
}) {
  const Icon = GROUP_ICONS[props.groupId] ?? LayoutDashboard;
  const openCount = props.modules.filter((module) =>
    moduleHasAccess(module, props.permissionMap, props.matrixScopes),
  ).length;

  return (
    <InsightSheetSection
      icon={<Icon size={15} aria-hidden />}
      title={props.title}
      hint={`${openCount} of ${props.modules.length} with access`}
      header={
        <GroupColumnHeader
          icon={<Icon size={15} aria-hidden />}
          title={props.title}
          hint={`${openCount} of ${props.modules.length} with access`}
        />
      }
    >
      <ul className="flex flex-col">
        {props.modules.map((module) => (
          <ModulePermissionRow
            key={module}
            module={module}
            permissionMap={props.permissionMap}
            matrixScopes={props.matrixScopes}
            onScopeChange={props.onScopeChange}
          />
        ))}
      </ul>
    </InsightSheetSection>
  );
}

function GroupColumnHeader(props: { icon: ReactNode; title: string; hint: string }) {
  return (
    <div className={cn(ROW_GRID, 'relative items-center')}>
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
          {props.icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-foreground text-sm font-semibold">{props.title}</h3>
          <p className="text-muted-foreground text-xs leading-snug">{props.hint}</p>
        </div>
      </div>
      {ROLE_PERMISSION_ACTIONS.map((action) => (
        <span
          key={action}
          className={cn(
            ROLE_PERMISSION_SCOPE_CONTROL_CLASS,
            'text-foreground text-center text-sm font-bold',
          )}
        >
          {action}
        </span>
      ))}
    </div>
  );
}

function moduleHasAccess(
  module: string,
  permissionMap: Map<string, RolePermissionDef>,
  matrixScopes: Record<string, RolePermissionScope>,
): boolean {
  return ROLE_PERMISSION_ACTIONS.some((action) => {
    const key = rolePermissionScopeKey(module, action);
    return permissionMap.has(key) && (matrixScopes[key] ?? 'NONE') !== 'NONE';
  });
}

function ModulePermissionRow(props: {
  module: string;
  permissionMap: Map<string, RolePermissionDef>;
  matrixScopes: Record<string, RolePermissionScope>;
  onScopeChange: (module: string, action: string, scope: RolePermissionScope) => void;
}) {
  return (
    <li
      className={cn(
        ROW_GRID,
        'hover:bg-muted/50 py-2 shadow-[inset_0_-1px_0_0_color-mix(in_oklch,var(--border)_40%,transparent)] transition-colors last:shadow-none hover:rounded-xl',
      )}
    >
      <span className="text-foreground truncate text-sm font-medium">
        {formatRolePermissionModuleName(props.module)}
      </span>
      {ROLE_PERMISSION_ACTIONS.map((action) => (
        <ScopeCell
          key={action}
          module={props.module}
          action={action}
          permissionMap={props.permissionMap}
          matrixScopes={props.matrixScopes}
          onScopeChange={props.onScopeChange}
        />
      ))}
    </li>
  );
}

function ScopeCell(props: {
  module: string;
  action: string;
  permissionMap: Map<string, RolePermissionDef>;
  matrixScopes: Record<string, RolePermissionScope>;
  onScopeChange: (module: string, action: string, scope: RolePermissionScope) => void;
}) {
  const key = rolePermissionScopeKey(props.module, props.action);
  const permission = props.permissionMap.get(key);
  if (!permission) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <RolePermissionScopeSelect
      value={props.matrixScopes[key] ?? 'NONE'}
      onValueChange={(next) => props.onScopeChange(props.module, props.action, next)}
    />
  );
}
