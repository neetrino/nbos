'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { EntityDetailSheetContent, LoadingState } from '@/components/shared';
import { SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS } from '@/components/shared/detail-sheet-classes';
import { RolePermissionsMatrix } from '@/features/settings/components/RolePermissionsMatrix';
import { RolePermissionsSaveConfirm } from '@/features/settings/components/RolePermissionsSaveConfirm';
import { RolePermissionsSheetHeader } from '@/features/settings/components/RolePermissionsSheetHeader';
import type {
  RolePermissionDef,
  RolePermissionScope,
  RoleWithPermissions,
} from '@/features/settings/components/role-permissions-types';

/** Matches the right-sheet viewport cap in `sheet.tsx` so `h-full` children can scroll. */
const ROLE_PERMISSIONS_SHEET_HEIGHT_CLASS = 'h-[calc(100vh-2.5vh)]';

/**
 * Wide monitors stay at 62vw. A 13" window grows the sheet into the free overlay
 * so module names and scope controls stay readable.
 */
const ROLE_PERMISSIONS_SHEET_WIDTH_CLASS =
  'flex w-full min-w-0 max-w-[100vw] flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[85vw] sm:max-w-none sm:data-[side=right]:w-[min(max(62vw,76rem),calc(100vw-2rem-2.75rem))]';

const ROLE_PERMISSIONS_SHEET_RAIL_CLASS = `${SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS} sm:right-[min(max(62vw,76rem),calc(100vw-2rem-2.75rem))]`;

export function RolePermissionsSheet(props: {
  open: boolean;
  role: RoleWithPermissions | null;
  loading: boolean;
  saving: boolean;
  saveConfirmOpen: boolean;
  allPermissions: RolePermissionDef[];
  matrixScopes: Record<string, RolePermissionScope>;
  onOpenChange: (open: boolean) => void;
  onScopeChange: (module: string, action: string, scope: RolePermissionScope) => void;
  onSaveConfirmOpenChange: (open: boolean) => void;
  onConfirmSave: () => void | Promise<void>;
}) {
  const roleId = props.role?.id ?? null;
  const [query, setQuery] = useState('');
  const [queryRoleId, setQueryRoleId] = useState(roleId);
  if (queryRoleId !== roleId) {
    setQueryRoleId(roleId);
    setQuery('');
  }

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <EntityDetailSheetContent
        open={props.open}
        layout="full"
        contentClassName={ROLE_PERMISSIONS_SHEET_WIDTH_CLASS}
        railAnchorClassName={ROLE_PERMISSIONS_SHEET_RAIL_CLASS}
        className={ROLE_PERMISSIONS_SHEET_HEIGHT_CLASS}
      >
        <div className="flex h-full min-h-0 flex-col">
          <RolePermissionsSheetHeader
            roleName={props.role?.name ?? 'Role'}
            isSystem={Boolean(props.role?.isSystem)}
            saving={props.saving}
            canSave={Boolean(props.role)}
            query={query}
            onQueryChange={setQuery}
            onSave={() => props.onSaveConfirmOpenChange(true)}
          />
          <ScrollArea className="min-h-0 flex-1">
            <div className="px-5 py-4">
              {props.loading || !props.role ? (
                <LoadingState count={6} />
              ) : (
                <RolePermissionsMatrix
                  allPermissions={props.allPermissions}
                  matrixScopes={props.matrixScopes}
                  query={query}
                  onScopeChange={props.onScopeChange}
                />
              )}
            </div>
          </ScrollArea>
        </div>
      </EntityDetailSheetContent>
      {props.role ? (
        <RolePermissionsSaveConfirm
          open={props.saveConfirmOpen}
          roleName={props.role.name}
          isSystem={props.role.isSystem}
          isSubmitting={props.saving}
          onOpenChange={props.onSaveConfirmOpenChange}
          onConfirm={props.onConfirmSave}
        />
      ) : null}
    </Sheet>
  );
}
