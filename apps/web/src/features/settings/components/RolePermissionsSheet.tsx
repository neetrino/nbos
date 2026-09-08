'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { EntityDetailSheetContent, LoadingState } from '@/components/shared';
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
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <EntityDetailSheetContent
        open={props.open}
        layout="full"
        width="wide"
        className={ROLE_PERMISSIONS_SHEET_HEIGHT_CLASS}
      >
        <div className="flex h-full min-h-0 flex-col">
          <RolePermissionsSheetHeader
            roleName={props.role?.name ?? 'Role'}
            isSystem={Boolean(props.role?.isSystem)}
            saving={props.saving}
            canSave={Boolean(props.role)}
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
