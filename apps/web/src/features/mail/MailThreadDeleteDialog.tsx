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
      title="Delete this email?"
      description="The thread and its messages will be removed from Mail. This action cannot be undone."
      confirmLabel="Delete"
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
      forceNestedBackdrop
    />
  );
}
