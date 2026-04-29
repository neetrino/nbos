'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
      toast.success('Credential archived');
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to archive');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Archive credential</DialogTitle>
          <DialogDescription>
            The record is hidden from active lists and project handoff counts; secrets stay in the
            database until a separate purge policy runs. You can restore it later from Archived.
            {credentialName ? (
              <>
                {' '}
                <span className="text-foreground font-medium">{credentialName}</span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={deleting || !credentialId}
          >
            {deleting ? 'Archiving…' : 'Archive'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
