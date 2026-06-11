'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CredentialFolderTreePicker } from '@/features/credentials/components/credential-folder-tree-picker';
import type { CredentialFolder } from '@/lib/api/credentials';

export interface CredentialVaultBulkFolderPickerDialogProps {
  open: boolean;
  folders: CredentialFolder[];
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (folderId: string) => void;
}

export function CredentialVaultBulkFolderPickerDialog({
  open,
  folders,
  busy,
  onOpenChange,
  onConfirm,
}: CredentialVaultBulkFolderPickerDialogProps) {
  const [folderId, setFolderId] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setFolderId(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move to folder</DialogTitle>
          <DialogDescription>
            Credentials will be placed in the selected folder (one folder per credential).
          </DialogDescription>
        </DialogHeader>
        <CredentialFolderTreePicker folders={folders} value={folderId} onChange={setFolderId} />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || !folderId}
            onClick={() => folderId && onConfirm(folderId)}
          >
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
