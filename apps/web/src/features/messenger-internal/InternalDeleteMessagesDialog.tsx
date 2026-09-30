'use client';

import { DeleteConfirmDialog } from '@/components/shared';

export function InternalDeleteMessagesDialog({
  open,
  count,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  count: number;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}) {
  const single = count === 1;
  return (
    <DeleteConfirmDialog
      level="simple"
      open={open}
      onOpenChange={onOpenChange}
      itemName=""
      title={single ? 'Delete message?' : `Delete ${count} messages?`}
      description="This cannot be undone. Only your messages will be deleted."
      confirmLabel={single ? 'Delete' : `Delete ${count}`}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
      forceNestedBackdrop
    />
  );
}
