'use client';

import { useEffect, useState } from 'react';
import { Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [folderId, setFolderId] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    setFolderId(folders[0]?.id ?? '');
  }, [open, folders]);

  const sortedFolders = [...folders].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move to folder</DialogTitle>
          <DialogDescription>
            Credentials will be placed in the selected folder (one folder per credential).
          </DialogDescription>
        </DialogHeader>
        <Select value={folderId || undefined} onValueChange={setFolderId}>
          <SelectTrigger>
            <SelectValue placeholder="Select folder">
              {(value) => sortedFolders.find((folder) => folder.id === value)?.name ?? 'Folder'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sortedFolders.map((folder) => (
              <SelectItem key={folder.id} value={folder.id}>
                <Folder className="size-4 text-amber-500/80" aria-hidden />
                {folder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="button" disabled={busy || !folderId} onClick={() => onConfirm(folderId)}>
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
