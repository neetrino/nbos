'use client';

import { useCallback, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { AmdCurrencyIcon } from '@/components/shared/AmdCurrencyIcon';
import { MoneyInput } from '@/components/shared/MoneyInput';
import { Input } from '@/components/ui/input';
import { formatAmountDramSuffix } from '@/features/finance/constants/finance';
import {
  PAYROLL_MATRIX_CELL_AMOUNT_DISPLAY_CLASS,
  PAYROLL_MATRIX_CELL_CURRENCY_SLOT_CLASS,
  PAYROLL_MATRIX_CELL_FIELD_SHELL_CLASS,
  PAYROLL_MATRIX_CELL_MONEY_INPUT_CLASS,
  PAYROLL_MATRIX_CELL_REASON_ARIA_KEY,
  PAYROLL_MATRIX_CELL_RELEASE_ARIA_KEY,
  PAYROLL_MATRIX_CELL_RELEASE_PLACEHOLDER_KEY,
  PAYROLL_MATRIX_CELL_WARNING_CLASS,
} from '@/features/finance/constants/payroll-allocation-matrix-cell-input';
import {
  matrixReleaseWarningForAmount,
  payrollMatrixCellCaptionMessageKey,
  resolveMatrixReleaseWarningKind,
} from '@/features/finance/utils/payroll-matrix-release-warning';
import type {
  PayrollAllocationMatrixCell,
  PayrollMatrixCellSavePayload,
} from '@/lib/api/payroll-allocation-matrix';
import { cn } from '@/lib/utils';

import { resolvePayrollMatrixCellSubmitPayload } from './build-payroll-matrix-cell-release-payload';
import {
  PayrollAllocationMatrixMultiSourceInput,
  sourceDraftsFromSources,
  sumSourceDraftAmounts,
} from './payroll-allocation-matrix-multi-source-input';

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

function isEarlyNonSalesReleasePreview(
  cell: PayrollAllocationMatrixCell,
  draftAmount: number,
  warningKind: ReturnType<typeof resolveMatrixReleaseWarningKind>,
): boolean {
  if (draftAmount <= 0 || warningKind != null) return false;
  if (cell.bonusType == null || cell.bonusType === 'SALES') return false;
  return cell.state === 'PROGRESS' || (cell.state === 'LINKED_EMPTY' && cell.bonusEntryId != null);
}

function payrollMatrixCellNeedsExceptionReason(params: {
  cell: PayrollAllocationMatrixCell;
  draftAmount: number;
  remaining: number;
  availableFunding: number;
}): boolean {
  if (params.cell.reasonRequired) return true;
  const kind = resolveMatrixReleaseWarningKind(
    params.draftAmount,
    params.remaining,
    params.availableFunding,
  );
  if (kind === 'EXTRA' || kind === 'OVER_FUNDING') return true;
  return isEarlyNonSalesReleasePreview(params.cell, params.draftAmount, kind);
}

function PayrollMatrixCellReasonInput(props: {
  value: string;
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <Input
      value={props.value}
      disabled={props.disabled}
      aria-label={props.label}
      placeholder={props.label}
      className={cn(PAYROLL_MATRIX_CELL_MONEY_INPUT_CLASS, 'text-left')}
      onChange={(event) => props.onChange(event.target.value)}
      onKeyDown={props.onKeyDown}
    />
  );
}

/** Bivariant so history callers typed without sourceAmounts still compile. */
export type PayrollMatrixCellSaveHandler = {
  bivarianceHack(payload: PayrollMatrixCellSavePayload): Promise<void>;
}['bivarianceHack'];

export function PayrollAllocationMatrixCellInput(props: {
  cell: PayrollAllocationMatrixCell;
  availableFunding: number;
  disabled: boolean;
  saving: boolean;
  onSave: PayrollMatrixCellSaveHandler;
}) {
  const { cell, availableFunding, disabled, saving, onSave } = props;
  const t = useTranslations('payroll');
  const sources = useMemo(() => cell.sourceEntries ?? [], [cell.sourceEntries]);
  const isMultiSource = sources.length >= 2;
  const sourceKey = sources
    .map((source) => `${source.bonusEntryId}:${source.includedThisMonth ?? ''}`)
    .join(',');
  const cellSyncKey = `${cell.employeeId}:${cell.orderId}:${cell.releaseThisMonth}:${sourceKey}`;
  const reasonSyncKey = `${cell.employeeId}:${cell.orderId}`;
  const [cellSyncSeen, setCellSyncSeen] = useState(cellSyncKey);
  const [reasonSyncSeen, setReasonSyncSeen] = useState(reasonSyncKey);
  const [amount, setAmount] = useState(() => releaseDraftFromCell(cell));
  const [sourceDrafts, setSourceDrafts] = useState(() => sourceDraftsFromSources(sources));
  const [reason, setReason] = useState('');
  const [focused, setFocused] = useState(false);
  const [sourceDirty, setSourceDirty] = useState(false);
  const ignoreNextSubmitRef = useRef(false);

  if (cellSyncKey !== cellSyncSeen) {
    setSourceDirty(false);
    setCellSyncSeen(cellSyncKey);
    setAmount(releaseDraftFromCell(cell));
    setSourceDrafts(sourceDraftsFromSources(sources));
    setFocused(false);
  }
  if (reasonSyncKey !== reasonSyncSeen) {
    setReasonSyncSeen(reasonSyncKey);
    setReason('');
  }

  const showCurrency = focused || amount.trim().length > 0;
  const remaining = parseMoney(cell.remaining);
  const draftAmount = isMultiSource ? sumSourceDraftAmounts(sourceDrafts) : parseMoney(amount);
  const needsReason = payrollMatrixCellNeedsExceptionReason({
    cell,
    draftAmount,
    remaining,
    availableFunding,
  });
  const previewKey = shouldPreviewAmountWarning(cell)
    ? matrixReleaseWarningForAmount(draftAmount, remaining, availableFunding)
    : null;
  const captionKey = previewKey ?? payrollMatrixCellCaptionMessageKey(cell);
  const caption = captionKey ? t(captionKey as never) : null;

  const submit = useCallback(async () => {
    if (disabled || saving) return;
    if (ignoreNextSubmitRef.current) {
      ignoreNextSubmitRef.current = false;
      return;
    }
    const payload = resolvePayrollMatrixCellSubmitPayload({
      isMultiSource,
      sourceEntryCount: sources.length,
      singleAmount: amount,
      sourceDrafts,
      savedRelease: cell.releaseThisMonth,
      sources,
      dirty: sourceDirty,
      needsReason,
      reason,
    });
    if (payload == null) return;
    await onSave(payload);
  }, [
    amount,
    cell.releaseThisMonth,
    disabled,
    isMultiSource,
    needsReason,
    onSave,
    reason,
    saving,
    sourceDirty,
    sourceDrafts,
    sources,
  ]);

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
      ignoreNextSubmitRef.current = true;
      setSourceDirty(false);
      setAmount(releaseDraftFromCell(cell));
      setSourceDrafts(sourceDraftsFromSources(sources));
      setReason('');
      setFocused(false);
    }
  };

  const handleSourceDraftChange = (bonusEntryId: string, nextAmount: string) => {
    setSourceDirty(true);
    setSourceDrafts((prev) =>
      prev.map((row) => (row.bonusEntryId === bonusEntryId ? { ...row, amount: nextAmount } : row)),
    );
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
      {isMultiSource ? (
        <PayrollAllocationMatrixMultiSourceInput
          sources={sources}
          drafts={sourceDrafts}
          disabled={disabled || saving}
          onDraftChange={handleSourceDraftChange}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
        />
      ) : (
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
      )}
      {needsReason ? (
        <PayrollMatrixCellReasonInput
          value={reason}
          disabled={disabled || saving}
          label={t(PAYROLL_MATRIX_CELL_REASON_ARIA_KEY)}
          onChange={setReason}
          onKeyDown={handleKeyDown}
        />
      ) : null}
      {caption ? (
        <span className={PAYROLL_MATRIX_CELL_WARNING_CLASS} role="status">
          {caption}
        </span>
      ) : null}
      {isMultiSource && saving ? (
        <Loader2 className="text-muted-foreground size-3 animate-spin self-center" aria-hidden />
      ) : null}
    </div>
  );
}
