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
import { formatAmount } from '@/features/finance/constants/finance';
import type { PayrollAllocationMatrixCell } from '@/lib/api/payroll-allocation-matrix';

export function PayrollAllocationMatrixCellDialog(props: {
  open: boolean;
  cell: PayrollAllocationMatrixCell | null;
  employeeLabel: string;
  unitLabel: string;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { releaseThisMonth: string; reason?: string }) => void;
}) {
  const { open, cell, employeeLabel, unitLabel, busy, onOpenChange, onSubmit } = props;
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!cell) return;
    setAmount(cell.releaseThisMonth === '0.00' ? '' : cell.releaseThisMonth);
    setReason('');
  }, [cell]);

  if (!cell) return null;

  const planned = Number.parseFloat(cell.plannedAmount);
  const remaining = Number.parseFloat(cell.remaining);
  const suggested = Number.parseFloat(cell.suggestedThisMonth);
  const needsReason = Number.parseFloat(amount || '0') > remaining || cell.state === 'OVER_FUNDING';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Release this month</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          {employeeLabel} · {unitLabel}
        </p>
        <dl className="text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-1 text-xs tabular-nums">
          <dt>Planned</dt>
          <dd>{formatAmount(planned)}</dd>
          <dt>Remaining</dt>
          <dd>{formatAmount(remaining)}</dd>
          <dt>Suggested</dt>
          <dd>{formatAmount(suggested)}</dd>
          <dt>Paid before</dt>
          <dd>{formatAmount(Number.parseFloat(cell.paidBefore))}</dd>
        </dl>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="matrix-release-amount">Release this month</Label>
            <Input
              id="matrix-release-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {needsReason ? (
            <div className="space-y-1">
              <Label htmlFor="matrix-release-reason">Reason</Label>
              <Textarea
                id="matrix-release-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
            </div>
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onSubmit({ releaseThisMonth: '0' })}
          >
            Clear release
          </Button>
          <Button
            type="button"
            disabled={busy || !amount.trim() || (needsReason && !reason.trim())}
            onClick={() =>
              onSubmit({
                releaseThisMonth: amount.trim(),
                reason: needsReason ? reason.trim() : undefined,
              })
            }
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
