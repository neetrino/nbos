'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface CredentialFolderNameDialogProps {
  open: boolean;
  title: string;
  initialName?: string;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void | Promise<void>;
}

export function CredentialFolderNameDialog({
  open,
  title,
  initialName = '',
  busy = false,
  onOpenChange,
  onSubmit,
}: CredentialFolderNameDialogProps) {
  const [name, setName] = useState(initialName);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setName(initialName);
  }

  const handleSubmit = () => {
    void onSubmit(name.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Folder name"
          autoFocus
          disabled={busy}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSubmit();
            }
          }}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={busy}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
