'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [confirmName, setConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) setConfirmName('');
  }, [open]);

  const nameOk =
    credentialName !== null &&
    confirmName.trim().length > 0 &&
    confirmName.trim() === credentialName.trim();

  const handlePermanentDelete = async () => {
    if (!credentialId || !nameOk) return;
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete permanently</DialogTitle>
          <DialogDescription>
            This removes the database row and encrypted secrets. Only archived credentials can be
            purged. This cannot be undone.
            {credentialName ? (
              <>
                {' '}
                Type <span className="text-foreground font-medium">{credentialName}</span> to
                confirm.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Label htmlFor="purge-confirm-name">Credential name</Label>
          <Input
            id="purge-confirm-name"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder="Exact name"
            autoComplete="off"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handlePermanentDelete()}
            disabled={deleting || !credentialId || !nameOk}
          >
            {deleting ? 'Deleting…' : 'Delete forever'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
