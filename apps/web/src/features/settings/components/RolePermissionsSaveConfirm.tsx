'use client';

import { DeleteConfirmDialog } from '@/components/shared';
import {
  rolePermissionSaveConfirmCopy,
  rolePermissionSaveConfirmLevel,
} from '@/features/settings/components/role-permission-save-confirm';

export function RolePermissionsSaveConfirm(props: {
  open: boolean;
  roleName: string;
  isSystem: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}) {
  const copy = rolePermissionSaveConfirmCopy(props.isSystem);
  return (
    <DeleteConfirmDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      level={rolePermissionSaveConfirmLevel(props.isSystem)}
      itemName={props.roleName}
      title={copy.title}
      description={copy.description}
      confirmLabel="Save"
      submittingLabel="Saving…"
      isSubmitting={props.isSubmitting}
      forceNestedBackdrop
      onConfirm={props.onConfirm}
    />
  );
}
