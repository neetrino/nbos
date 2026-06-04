'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export interface CredentialTypeChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromLabel: string;
  toLabel: string;
  onConfirm: () => void;
}

export function CredentialTypeChangeDialog({
  open,
  onOpenChange,
  fromLabel,
  toLabel,
  onConfirm,
}: CredentialTypeChangeDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setAcknowledged(false);
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change credential type?</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Switching from <span className="text-foreground font-medium">{fromLabel}</span> to{' '}
          <span className="text-foreground font-medium">{toLabel}</span> hides secret fields that do
          not apply to the new type. Stored secrets remain in the vault but will not show in this
          form until you switch back.
        </p>
        <div className="flex items-start gap-2 pt-1">
          <Checkbox
            id="cred-type-change-ack"
            checked={acknowledged}
            onCheckedChange={(v) => setAcknowledged(v === true)}
          />
          <Label htmlFor="cred-type-change-ack" className="text-sm leading-snug font-normal">
            I understand existing secrets may be hidden in this form
          </Label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!acknowledged} onClick={onConfirm}>
            Change type
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
