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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function PayrollAllocationMatrixManualDialog(props: {
  open: boolean;
  employeeLabel: string;
  unitLabel: string;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { title: string; amount: string; reason: string }) => void;
}) {
  const { open, employeeLabel, unitLabel, busy, onOpenChange, onSubmit } = props;
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setAmount('');
    setReason('');
  }, [open, employeeLabel, unitLabel]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manual bonus</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          {employeeLabel} · {unitLabel}
        </p>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="manual-bonus-title">Title</Label>
            <Input
              id="manual-bonus-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bonus title"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="manual-bonus-amount">Amount</Label>
            <Input
              id="manual-bonus-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="manual-bonus-reason">Reason</Label>
            <Textarea
              id="manual-bonus-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || !title.trim() || !amount.trim() || !reason.trim()}
            onClick={() =>
              onSubmit({ title: title.trim(), amount: amount.trim(), reason: reason.trim() })
            }
          >
            Create bonus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
