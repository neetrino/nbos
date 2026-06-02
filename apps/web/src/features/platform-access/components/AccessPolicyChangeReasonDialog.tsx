'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ACCESS_POLICY_CHANGE_REASON_MIN_LENGTH } from '../utils/access-policy-risk';

export interface AccessPolicyChangeReasonDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

export function AccessPolicyChangeReasonDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  onOpenChange,
  onConfirm,
}: AccessPolicyChangeReasonDialogProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  const trimmed = reason.trim();
  const valid = trimmed.length >= ACCESS_POLICY_CHANGE_REASON_MIN_LENGTH;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-muted-foreground text-sm">{description}</p>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="access-policy-change-reason">Change reason</Label>
          <Textarea
            id="access-policy-change-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why is this access change needed?"
            className="min-h-[88px] text-sm"
          />
          <p className="text-muted-foreground text-xs">
            At least {ACCESS_POLICY_CHANGE_REASON_MIN_LENGTH} characters (stored in audit log).
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!valid}
            onClick={() => {
              onConfirm(trimmed);
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
