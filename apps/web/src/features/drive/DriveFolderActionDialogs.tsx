'use client';

import { useEffect, useState } from 'react';
import { DeleteConfirmDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DriveFolder } from '@/lib/api/drive';
import { DRIVE_FOLDER_NAME_MAX_LENGTH } from './drive-folder-tree';

export function DriveCreateFolderDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setName('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
          <DialogDescription>
            Choose a name for the folder in the current location.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-1">
          <Label htmlFor="drive-new-folder-name">Name</Label>
          <Input
            id="drive-new-folder-name"
            maxLength={DRIVE_FOLDER_NAME_MAX_LENGTH}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Folder name"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || !name.trim()}
            onClick={async () => {
              const trimmed = name.trim();
              if (!trimmed) return;
              setBusy(true);
              try {
                await onSubmit(trimmed);
                onOpenChange(false);
              } catch {
                // Caller shows toast.
              } finally {
                setBusy(false);
              }
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DriveRenameFolderDialog({
  folder,
  open,
  onOpenChange,
  onSubmit,
}: {
  folder: DriveFolder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (folderId: string, name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (folder && open) setName(folder.name);
  }, [folder, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rename folder</DialogTitle>
          <DialogDescription>Update how this folder appears in Drive.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-1">
          <Label htmlFor="drive-rename-folder-name">Name</Label>
          <Input
            id="drive-rename-folder-name"
            maxLength={DRIVE_FOLDER_NAME_MAX_LENGTH}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || !folder || !name.trim() || name.trim() === folder.name}
            onClick={async () => {
              if (!folder) return;
              const trimmed = name.trim();
              if (!trimmed) return;
              setBusy(true);
              try {
                await onSubmit(folder.id, trimmed);
                onOpenChange(false);
              } catch {
                // Caller shows toast.
              } finally {
                setBusy(false);
              }
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DriveDeleteFolderDialog({
  folder,
  open,
  onOpenChange,
  onConfirm,
}: {
  folder: DriveFolder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (folderId: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <DeleteConfirmDialog
      level="simple"
      open={open}
      onOpenChange={onOpenChange}
      itemName={folder?.name ?? ''}
      title="Delete folder?"
      isSubmitting={busy}
      onConfirm={async () => {
        if (!folder) return;
        setBusy(true);
        try {
          await onConfirm(folder.id);
          onOpenChange(false);
        } catch {
          // Caller shows toast.
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}
