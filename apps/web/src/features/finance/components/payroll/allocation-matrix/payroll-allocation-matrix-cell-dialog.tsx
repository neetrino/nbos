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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatAmount } from '@/features/finance/constants/finance';
import type { PayrollAllocationMatrixCell } from '@/lib/api/payroll-allocation-matrix';

export type MatrixEmployeeOption = { id: string; label: string };

export function PayrollAllocationMatrixCellDialog(props: {
  open: boolean;
  cell: PayrollAllocationMatrixCell | null;
  employeeOptions: MatrixEmployeeOption[];
  employeeLabel: string;
  unitLabel: string;
  busy: boolean;
  plannedBusy: boolean;
  reassignBusy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitRelease: (payload: { releaseThisMonth: string; reason?: string }) => void;
  onSubmitPlanned: (payload: { amount: string; title?: string; reason: string }) => void;
  onSubmitReassign: (payload: { toEmployeeId: string; reason: string }) => void;
}) {
  const {
    open,
    cell,
    employeeOptions,
    employeeLabel,
    unitLabel,
    busy,
    plannedBusy,
    reassignBusy,
    onOpenChange,
    onSubmitRelease,
    onSubmitPlanned,
    onSubmitReassign,
  } = props;
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [plannedAmount, setPlannedAmount] = useState('');
  const [plannedTitle, setPlannedTitle] = useState('');
  const [plannedReason, setPlannedReason] = useState('');
  const [reassignToId, setReassignToId] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  useEffect(() => {
    if (!cell) return;
    setAmount(cell.releaseThisMonth === '0.00' ? '' : cell.releaseThisMonth);
    setReason('');
    setPlannedAmount(cell.currentAmount);
    setPlannedTitle(cell.bonusTitle ?? '');
    setPlannedReason('');
    setReassignToId('');
    setReassignReason('');
  }, [cell]);

  if (!cell) return null;

  const planned = Number.parseFloat(cell.plannedAmount);
  const remaining = Number.parseFloat(cell.remaining);
  const suggested = Number.parseFloat(cell.suggestedThisMonth);
  const original = cell.originalAmount != null ? Number.parseFloat(cell.originalAmount) : null;
  const needsReleaseReason =
    Number.parseFloat(amount || '0') > remaining || cell.state === 'OVER_FUNDING';
  const plannedChanged = plannedAmount.trim() !== cell.currentAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Matrix cell</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          {employeeLabel} · {unitLabel}
        </p>
        {cell.bonusTitle ? <p className="text-sm font-medium">{cell.bonusTitle}</p> : null}
        {original != null && original !== planned ? (
          <p className="text-muted-foreground text-xs tabular-nums">
            Original planned {formatAmount(original)} · Current {formatAmount(planned)}
          </p>
        ) : null}
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

        <div className="space-y-3 border-t pt-3">
          <p className="text-sm font-medium">Release this month</p>
          <div className="space-y-1">
            <Label htmlFor="matrix-release-amount">Amount</Label>
            <Input
              id="matrix-release-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {needsReleaseReason ? (
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
          <DialogFooter className="gap-2 px-0 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onSubmitRelease({ releaseThisMonth: '0' })}
            >
              Clear release
            </Button>
            <Button
              type="button"
              disabled={busy || !amount.trim() || (needsReleaseReason && !reason.trim())}
              onClick={() =>
                onSubmitRelease({
                  releaseThisMonth: amount.trim(),
                  reason: needsReleaseReason ? reason.trim() : undefined,
                })
              }
            >
              Save release
            </Button>
          </DialogFooter>
        </div>

        {cell.bonusEntryId ? (
          <div className="space-y-3 border-t pt-3">
            <p className="text-sm font-medium">Edit planned bonus</p>
            <div className="space-y-1">
              <Label htmlFor="matrix-planned-title">Title</Label>
              <Input
                id="matrix-planned-title"
                value={plannedTitle}
                onChange={(e) => setPlannedTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="matrix-planned-amount">Planned amount</Label>
              <Input
                id="matrix-planned-amount"
                inputMode="decimal"
                value={plannedAmount}
                onChange={(e) => setPlannedAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="matrix-planned-reason">Reason</Label>
              <Textarea
                id="matrix-planned-reason"
                value={plannedReason}
                onChange={(e) => setPlannedReason(e.target.value)}
                rows={2}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={
                plannedBusy || !plannedChanged || !plannedAmount.trim() || !plannedReason.trim()
              }
              onClick={() =>
                onSubmitPlanned({
                  amount: plannedAmount.trim(),
                  title: plannedTitle.trim() || undefined,
                  reason: plannedReason.trim(),
                })
              }
            >
              Save planned bonus
            </Button>
            <div className="space-y-3 border-t pt-3">
              <p className="text-sm font-medium">Reassign recipient</p>
              <div className="space-y-1">
                <Label htmlFor="matrix-reassign-employee">New recipient</Label>
                <Select value={reassignToId} onValueChange={setReassignToId}>
                  <SelectTrigger id="matrix-reassign-employee">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeOptions
                      .filter((e) => e.id !== cell.employeeId)
                      .map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="matrix-reassign-reason">Reason</Label>
                <Textarea
                  id="matrix-reassign-reason"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  rows={2}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={reassignBusy || !reassignToId || !reassignReason.trim()}
                onClick={() =>
                  onSubmitReassign({
                    toEmployeeId: reassignToId,
                    reason: reassignReason.trim(),
                  })
                }
              >
                Reassign bonus
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
