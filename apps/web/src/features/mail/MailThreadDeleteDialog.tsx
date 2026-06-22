'use client';

import { DeleteConfirmDialog } from '@/components/shared';

export interface MailThreadDeleteDialogProps {
  threadSubject: string;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

export function MailThreadDeleteDialog({
  threadSubject,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: MailThreadDeleteDialogProps) {
  return (
    <DeleteConfirmDialog
      level="simple"
      open={open}
      onOpenChange={onOpenChange}
      itemName={threadSubject}
      title="Move to Trash?"
      description="The thread will be hidden from your inbox. You can restore it from Trash before retention purge."
      confirmLabel="Move to Trash"
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
      forceNestedBackdrop
    />
  );
}
