'use client';

import {
  useCallback,
  useEffect,
  useId,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { Loader2 } from 'lucide-react';
import { MoneyInput } from '@/components/shared/MoneyInput';
import { Textarea } from '@/components/ui/textarea';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  PAYROLL_MATRIX_CELL_INPUT_CLASS,
  PAYROLL_MATRIX_CELL_REASON_CLASS,
} from '@/features/finance/constants/payroll-allocation-matrix-cell-input';
import { payrollMatrixReleaseNeedsReason } from '@/features/finance/utils/payroll-matrix-release-needs-reason';
import type { PayrollAllocationMatrixCell } from '@/lib/api/payroll-allocation-matrix';
import { cn } from '@/lib/utils';

function parseMoney(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function releaseDraftFromCell(cell: PayrollAllocationMatrixCell): string {
  return parseMoney(cell.releaseThisMonth) > 0 ? cell.releaseThisMonth : '';
}

export function PayrollAllocationMatrixCellInput(props: {
  cell: PayrollAllocationMatrixCell;
  availableFunding: number;
  disabled: boolean;
  saving: boolean;
  onSave: (payload: { releaseThisMonth: string; reason?: string }) => Promise<void>;
}) {
  const { cell, availableFunding, disabled, saving, onSave } = props;
  const reasonId = useId();
  const [amount, setAmount] = useState(() => releaseDraftFromCell(cell));
  const [reason, setReason] = useState('');
  const [reasonOpen, setReasonOpen] = useState(false);

  useEffect(() => {
    setAmount(releaseDraftFromCell(cell));
    setReason('');
    setReasonOpen(false);
  }, [cell.employeeId, cell.orderId, cell.releaseThisMonth]);

  const submit = useCallback(async () => {
    if (disabled || saving) return;

    const releaseThisMonth = amount.trim() || '0';
    const next = parseMoney(releaseThisMonth);
    const current = parseMoney(cell.releaseThisMonth);
    if (next === current && !reasonOpen) return;

    const needsReason = payrollMatrixReleaseNeedsReason(
      next,
      parseMoney(cell.remaining),
      availableFunding,
    );
    if (needsReason && !reason.trim()) {
      setReasonOpen(true);
      return;
    }

    await onSave({
      releaseThisMonth,
      reason: needsReason ? reason.trim() : undefined,
    });
    setReason('');
    setReasonOpen(false);
  }, [
    amount,
    availableFunding,
    cell.releaseThisMonth,
    cell.remaining,
    disabled,
    onSave,
    reason,
    reasonOpen,
    saving,
  ]);

  const handleContainerBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (next && event.currentTarget.contains(next)) return;
    void submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void submit();
    }
    if (event.key === 'Escape') {
      setAmount(releaseDraftFromCell(cell));
      setReason('');
      setReasonOpen(false);
    }
  };

  if (!cell.editable) {
    return (
      <div className="flex min-h-[2.75rem] flex-col items-center justify-center px-1 py-1 tabular-nums">
        <span>
          {parseMoney(cell.releaseThisMonth) > 0
            ? formatAmount(parseMoney(cell.releaseThisMonth))
            : '—'}
        </span>
        {cell.warning ? <span className="text-[10px] font-medium">{cell.warning}</span> : null}
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-[2.75rem] flex-col items-stretch justify-center gap-0.5 px-0.5 py-0.5"
      onBlur={handleContainerBlur}
    >
      <div className="relative">
        <MoneyInput
          value={amount}
          onChange={setAmount}
          disabled={disabled || saving}
          placeholder="—"
          aria-label="Bonus release this month"
          className={PAYROLL_MATRIX_CELL_INPUT_CLASS}
          onKeyDown={handleKeyDown}
        />
        {saving ? (
          <Loader2
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-1 size-3 -translate-y-1/2 animate-spin"
            aria-hidden
          />
        ) : null}
      </div>
      {reasonOpen ? (
        <Textarea
          id={reasonId}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason required"
          rows={2}
          disabled={disabled || saving}
          className={PAYROLL_MATRIX_CELL_REASON_CLASS}
          onKeyDown={handleKeyDown}
        />
      ) : null}
      {cell.warning ? (
        <span className={cn('text-center text-[10px] font-medium')}>{cell.warning}</span>
      ) : null}
    </div>
  );
}
