'use client';

import { useState } from 'react';
import { DeleteConfirmDialog } from '@/components/shared';
import { CredentialStepUpDialog } from '@/features/credentials/components/credential-step-up-dialog';
import { credentialPermanentDeleteNeedsStepUp } from '@/features/credentials/constants/credential-permanent-delete';
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
  criticality,
  open,
  onOpenChange,
  onDeleted,
}: PermanentDeleteCredentialDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const needsStepUp = credentialPermanentDeleteNeedsStepUp(criticality ?? undefined);

  const runDelete = async (stepUpPassword?: string) => {
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
    if (needsStepUp) {
      setStepUpOpen(true);
      return;
    }
    void runDelete();
  };

  return (
    <>
      <DeleteConfirmDialog
        level="strong"
        open={open}
        onOpenChange={onOpenChange}
        itemName={credentialName ?? ''}
        title="Delete permanently?"
        description={
          needsStepUp
            ? 'Removes the database row and encrypted secrets. Step-up required for high/critical credentials.'
            : 'Removes the database row and encrypted secrets. Only archived credentials can be purged.'
        }
        confirmLabel="Delete forever"
        isSubmitting={deleting}
        onConfirm={handleConfirm}
      />
      <CredentialStepUpDialog
        open={stepUpOpen}
        onOpenChange={setStepUpOpen}
        title="Confirm permanent delete"
        onConfirm={(pwd) => runDelete(pwd)}
      />
    </>
  );
}
