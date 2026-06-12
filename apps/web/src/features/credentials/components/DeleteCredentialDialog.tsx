'use client';

import { useState } from 'react';
import { DeleteConfirmDialog } from '@/components/shared';
import { credentialsApi } from '@/lib/api/credentials';
import { toast } from 'sonner';

export interface DeleteCredentialDialogProps {
  credentialId: string | null;
  credentialName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteCredentialDialog({
  credentialId,
  credentialName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteCredentialDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!credentialId) return;
    setDeleting(true);
    try {
      await credentialsApi.delete(credentialId);
      toast.success('Credential moved to Trash');
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to archive');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DeleteConfirmDialog
      level="simple"
      open={open}
      onOpenChange={onOpenChange}
      itemName={credentialName ?? ''}
      title="Move credential to Trash?"
      description="Moved to Trash and removed from folders. You can restore it from Trash (returns unfiled)."
      confirmLabel="Move to Trash"
      isSubmitting={deleting}
      onConfirm={handleDelete}
    />
  );
}
