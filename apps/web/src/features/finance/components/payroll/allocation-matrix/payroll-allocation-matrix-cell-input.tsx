'use client';

import { useCallback, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { AmdCurrencyIcon } from '@/components/shared/AmdCurrencyIcon';
import { MoneyInput } from '@/components/shared/MoneyInput';
import { formatAmountDramSuffix } from '@/features/finance/constants/finance';
import {
  PAYROLL_MATRIX_CELL_AMOUNT_DISPLAY_CLASS,
  PAYROLL_MATRIX_CELL_CURRENCY_SLOT_CLASS,
  PAYROLL_MATRIX_CELL_FIELD_SHELL_CLASS,
  PAYROLL_MATRIX_CELL_MONEY_INPUT_CLASS,
  PAYROLL_MATRIX_CELL_RELEASE_ARIA_KEY,
  PAYROLL_MATRIX_CELL_RELEASE_PLACEHOLDER_KEY,
  PAYROLL_MATRIX_CELL_WARNING_CLASS,
} from '@/features/finance/constants/payroll-allocation-matrix-cell-input';
import {
  matrixReleaseWarningForAmount,
  payrollMatrixCellCaptionMessageKey,
} from '@/features/finance/utils/payroll-matrix-release-warning';
import type { PayrollAllocationMatrixCell } from '@/lib/api/payroll-allocation-matrix';
import { cn } from '@/lib/utils';

function parseMoney(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function releaseDraftFromCell(cell: PayrollAllocationMatrixCell): string {
  const amount = parseMoney(cell.releaseThisMonth);
  if (amount <= 0) {
    return '';
  }
  return Number.isInteger(amount) ? String(Math.round(amount)) : String(amount);
}

function shouldPreviewAmountWarning(cell: PayrollAllocationMatrixCell): boolean {
  return cell.state !== 'MANUAL_BONUS';
}

export function PayrollAllocationMatrixCellInput(props: {
  cell: PayrollAllocationMatrixCell;
  availableFunding: number;
  disabled: boolean;
  saving: boolean;
  onSave: (payload: { releaseThisMonth: string; reason?: string }) => Promise<void>;
}) {
  const { cell, availableFunding, disabled, saving, onSave } = props;
  const t = useTranslations('payroll');
  const cellSyncKey = `${cell.employeeId}:${cell.orderId}:${cell.releaseThisMonth}`;
  const [cellSyncSeen, setCellSyncSeen] = useState(cellSyncKey);
  const [amount, setAmount] = useState(() => releaseDraftFromCell(cell));
  const [focused, setFocused] = useState(false);

  if (cellSyncKey !== cellSyncSeen) {
    setCellSyncSeen(cellSyncKey);
    setAmount(releaseDraftFromCell(cell));
    setFocused(false);
  }

  const showCurrency = focused || amount.trim().length > 0;
  const remaining = parseMoney(cell.remaining);
  const draftAmount = parseMoney(amount);
  const previewKey = shouldPreviewAmountWarning(cell)
    ? matrixReleaseWarningForAmount(draftAmount, remaining, availableFunding)
    : null;
  const captionKey = previewKey ?? payrollMatrixCellCaptionMessageKey(cell);
  const caption = captionKey ? t(captionKey as never) : null;

  const submit = useCallback(async () => {
    if (disabled || saving) return;

    const releaseThisMonth = amount.trim() || '0';
    const next = parseMoney(releaseThisMonth);
    const current = parseMoney(cell.releaseThisMonth);
    if (next === current) return;

    await onSave({ releaseThisMonth });
  }, [amount, cell.releaseThisMonth, disabled, onSave, saving]);

  const handleContainerBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (next && event.currentTarget.contains(next)) return;
    setFocused(false);
    void submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void submit();
    }
    if (event.key === 'Escape') {
      setAmount(releaseDraftFromCell(cell));
      setFocused(false);
    }
  };

  if (!cell.editable) {
    const hasRelease = parseMoney(cell.releaseThisMonth) > 0;
    if (!hasRelease) {
      return <div className="min-h-[2.25rem]" aria-hidden />;
    }
    const readOnlyCaptionKey = payrollMatrixCellCaptionMessageKey(cell);
    const readOnlyCaption = readOnlyCaptionKey ? t(readOnlyCaptionKey as never) : null;
    return (
      <div className="flex min-h-[2.25rem] min-w-0 flex-col items-stretch justify-center overflow-hidden px-2 py-1">
        <span className={PAYROLL_MATRIX_CELL_AMOUNT_DISPLAY_CLASS}>
          {formatAmountDramSuffix(parseMoney(cell.releaseThisMonth))}
        </span>
        {readOnlyCaption ? (
          <span className={PAYROLL_MATRIX_CELL_WARNING_CLASS}>{readOnlyCaption}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-[2.25rem] min-w-0 flex-col items-stretch justify-center gap-0.5 overflow-hidden px-1 py-1"
      onBlur={handleContainerBlur}
    >
      <div className={cn(PAYROLL_MATRIX_CELL_FIELD_SHELL_CLASS, 'relative')}>
        <MoneyInput
          value={amount}
          onChange={setAmount}
          disabled={disabled || saving}
          placeholder={
            cell.bonusEntryId ? t(PAYROLL_MATRIX_CELL_RELEASE_PLACEHOLDER_KEY) : undefined
          }
          aria-label={t(PAYROLL_MATRIX_CELL_RELEASE_ARIA_KEY)}
          className={PAYROLL_MATRIX_CELL_MONEY_INPUT_CLASS}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
        />
        <span
          className={cn(PAYROLL_MATRIX_CELL_CURRENCY_SLOT_CLASS, !showCurrency && 'invisible')}
          aria-hidden
        >
          <AmdCurrencyIcon className="text-muted-foreground" />
        </span>
        {saving ? (
          <Loader2
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-1 size-3 -translate-y-1/2 animate-spin"
            aria-hidden
          />
        ) : null}
      </div>
      {caption ? (
        <span className={PAYROLL_MATRIX_CELL_WARNING_CLASS} role="status">
          {caption}
        </span>
      ) : null}
    </div>
  );
}
