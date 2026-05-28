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
import { AmdCurrencyIcon } from '@/components/shared/AmdCurrencyIcon';
import { MoneyInput } from '@/components/shared/MoneyInput';
import { Textarea } from '@/components/ui/textarea';
import { formatAmountDramSuffix } from '@/features/finance/constants/finance';
import {
  PAYROLL_MATRIX_CELL_AMOUNT_DISPLAY_CLASS,
  PAYROLL_MATRIX_CELL_FIELD_SHELL_CLASS,
  PAYROLL_MATRIX_CELL_MONEY_INPUT_CLASS,
  PAYROLL_MATRIX_CELL_REASON_CLASS,
  PAYROLL_MATRIX_CELL_RELEASE_PLACEHOLDER,
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
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setAmount(releaseDraftFromCell(cell));
    setReason('');
    setReasonOpen(false);
    setFocused(false);
  }, [cell.employeeId, cell.orderId, cell.releaseThisMonth]);

  const showCurrency = focused || amount.trim().length > 0;

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
    setFocused(false);
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
      setFocused(false);
    }
  };

  if (!cell.editable) {
    const hasRelease = parseMoney(cell.releaseThisMonth) > 0;
    if (!hasRelease) {
      return <div className="min-h-[2.75rem]" aria-hidden />;
    }
    return (
      <div className="flex min-h-[2.75rem] flex-col items-end justify-center px-2 py-1">
        <span className={PAYROLL_MATRIX_CELL_AMOUNT_DISPLAY_CLASS}>
          {formatAmountDramSuffix(parseMoney(cell.releaseThisMonth))}
        </span>
        {cell.warning ? <span className="text-[10px] font-medium">{cell.warning}</span> : null}
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-[2.75rem] flex-col items-stretch justify-center gap-1 px-1 py-1"
      onBlur={handleContainerBlur}
    >
      <div className={cn(PAYROLL_MATRIX_CELL_FIELD_SHELL_CLASS, 'relative')}>
        <MoneyInput
          value={amount}
          onChange={setAmount}
          disabled={disabled || saving}
          placeholder={cell.bonusEntryId ? PAYROLL_MATRIX_CELL_RELEASE_PLACEHOLDER : undefined}
          aria-label="Bonus release this month"
          className={PAYROLL_MATRIX_CELL_MONEY_INPUT_CLASS}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
        />
        {showCurrency ? <AmdCurrencyIcon className="text-muted-foreground shrink-0" /> : null}
        {saving ? (
          <Loader2
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-1 size-3 -translate-y-1/2 animate-spin"
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
