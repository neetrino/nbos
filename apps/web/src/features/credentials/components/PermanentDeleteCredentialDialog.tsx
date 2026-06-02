'use client';

import { useState } from 'react';
import { DeleteConfirmDialog } from '@/components/shared';
import { CredentialStepUpDialog } from '@/features/credentials/components/credential-step-up-dialog';
import { credentialsApi } from '@/lib/api/credentials';
import { toast } from 'sonner';

export interface PermanentDeleteCredentialDialogProps {
  credentialId: string | null;
  credentialName: string | null;
  criticality?: string | null;
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
  const [stepUpOpen, setStepUpOpen] = useState(false);

  const runDelete = async (stepUpPassword: string) => {
    if (!credentialId) return;
    setDeleting(true);
    try {
      await credentialsApi.permanentDelete(credentialId, stepUpPassword);
      toast.success('Credential permanently removed');
      onOpenChange(false);
      setStepUpOpen(false);
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirm = () => {
    setStepUpOpen(true);
  };

  return (
    <>
      <DeleteConfirmDialog
        level="strong"
        open={open}
        onOpenChange={onOpenChange}
        itemName={credentialName ?? ''}
        title="Delete permanently?"
        description="Removes the database row and encrypted secrets. Account password required."
        confirmLabel="Delete forever"
        isSubmitting={deleting}
        onConfirm={handleConfirm}
      />
      <CredentialStepUpDialog
        open={stepUpOpen}
        onOpenChange={setStepUpOpen}
        title="Confirm permanent delete"
        onConfirm={(pwd) => void runDelete(pwd)}
      />
    </>
  );
}
