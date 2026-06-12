'use client';

import { DeleteConfirmDialog } from '../delete-confirm';

export interface ProfileAPermanentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  entityLabel: string;
  isSubmitting?: boolean;
  onConfirm: () => void | Promise<void>;
}

/** Strong name-match confirm for Profile A manual purge (no step-up). */
export function ProfileAPermanentDeleteDialog({
  open,
  onOpenChange,
  itemName,
  entityLabel,
  isSubmitting = false,
  onConfirm,
}: ProfileAPermanentDeleteDialogProps) {
  return (
    <DeleteConfirmDialog
      level="strong"
      open={open}
      onOpenChange={onOpenChange}
      itemName={itemName}
      title="Delete permanently?"
      description={`Removes this ${entityLabel} from the database. Cannot be undone. Related records may block deletion.`}
      confirmLabel="Delete forever"
      isSubmitting={isSubmitting}
      onConfirm={onConfirm}
      forceNestedBackdrop
    />
  );
}
