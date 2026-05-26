'use client';

import { useState } from 'react';
import { DeleteConfirmDialog } from '@/components/shared';
import { credentialsApi } from '@/lib/api/credentials';
import { toast } from 'sonner';

export interface PermanentDeleteCredentialDialogProps {
  credentialId: string | null;
  credentialName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function PermanentDeleteCredentialDialog({
  credentialId,
  credentialName,
  open,
  onOpenChange,
  onDeleted,
}: PermanentDeleteCredentialDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handlePermanentDelete = async () => {
    if (!credentialId) return;
    setDeleting(true);
    try {
      await credentialsApi.permanentDelete(credentialId);
      toast.success('Credential permanently removed');
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DeleteConfirmDialog
      level="strong"
      open={open}
      onOpenChange={onOpenChange}
      itemName={credentialName ?? ''}
      title="Delete permanently?"
      confirmLabel="Delete forever"
      isSubmitting={deleting}
      onConfirm={handlePermanentDelete}
    />
  );
}
