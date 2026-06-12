'use client';

import { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { CredentialFolder } from '@/lib/api/credentials';

interface CredentialFolderCreateButtonProps {
  onCreateFolder: (name: string) => Promise<CredentialFolder>;
}

export function CredentialFolderCreateButton({
  onCreateFolder,
}: CredentialFolderCreateButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const closeDialog = () => {
    if (busy) return;
    setOpen(false);
    setName('');
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Folder name is required');
      return;
    }
    setBusy(true);
    try {
      await onCreateFolder(trimmed);
      toast.success('Folder created');
      closeDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Folder could not be saved');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 rounded-full border-amber-500/45 bg-amber-500/12 px-4 text-sm text-amber-800 hover:bg-amber-500/20 dark:text-amber-300"
        onClick={() => setOpen(true)}
      >
        <FolderPlus className="size-4" aria-hidden />
        Folder
      </Button>

      <Dialog open={open} onOpenChange={(next) => (!next ? closeDialog() : setOpen(true))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Folder name"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void submit();
              }
            }}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={busy}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void submit()} disabled={busy}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
