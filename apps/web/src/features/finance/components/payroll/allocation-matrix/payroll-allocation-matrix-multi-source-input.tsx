'use client';

import type { KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { AmdCurrencyIcon } from '@/components/shared/AmdCurrencyIcon';
import { MoneyInput } from '@/components/shared/MoneyInput';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  PAYROLL_MATRIX_CELL_CURRENCY_SLOT_CLASS,
  PAYROLL_MATRIX_CELL_FIELD_SHELL_CLASS,
  PAYROLL_MATRIX_CELL_MONEY_INPUT_CLASS,
} from '@/features/finance/constants/payroll-allocation-matrix-cell-input';
import type { PayrollAllocationMatrixCellSource } from '@/lib/api/payroll-allocation-matrix';
import { cn } from '@/lib/utils';

import type { PayrollMatrixSourceAmountDraft } from './build-payroll-matrix-cell-release-payload';

function parseMoney(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function sourceLabel(source: PayrollAllocationMatrixCellSource): string {
  const title = source.title?.trim();
  if (title != null && title.length > 0) return title;
  return source.type;
}

function draftAmountText(value: string | undefined): string {
  const amount = parseMoney(value ?? '');
  if (amount <= 0) return '';
  return Number.isInteger(amount) ? String(Math.round(amount)) : String(amount);
}

/** Prefills each source with the split already saved on this payroll run. */
export function sourceDraftsFromSources(
  sources: Pick<PayrollAllocationMatrixCellSource, 'bonusEntryId' | 'includedThisMonth'>[],
): PayrollMatrixSourceAmountDraft[] {
  return sources.map((source) => ({
    bonusEntryId: source.bonusEntryId,
    amount: draftAmountText(source.includedThisMonth),
  }));
}

export function sumSourceDraftAmounts(drafts: PayrollMatrixSourceAmountDraft[]): number {
  return drafts.reduce((sum, draft) => sum + parseMoney(draft.amount), 0);
}

export function PayrollAllocationMatrixMultiSourceInput(props: {
  sources: PayrollAllocationMatrixCellSource[];
  drafts: PayrollMatrixSourceAmountDraft[];
  disabled: boolean;
  onDraftChange: (bonusEntryId: string, amount: string) => void;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  const t = useTranslations('payroll');
  const { sources, drafts, disabled, onDraftChange, onFocus, onKeyDown } = props;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      {sources.map((source) => {
        const draft = drafts.find((row) => row.bonusEntryId === source.bonusEntryId);
        const amount = draft?.amount ?? '';
        const showCurrency = amount.trim().length > 0;
        const remaining = parseMoney(source.remainingAmount);
        return (
          <div key={source.bonusEntryId} className="flex min-w-0 flex-col gap-0.5">
            <div className="text-muted-foreground flex min-w-0 items-baseline justify-between gap-1 text-[10px]">
              <span className="truncate font-medium">{sourceLabel(source)}</span>
              <span className="shrink-0 tabular-nums">
                {t('matrix.cell.sourceRemaining', { amount: formatAmount(remaining) })}
              </span>
            </div>
            <div className={cn(PAYROLL_MATRIX_CELL_FIELD_SHELL_CLASS, 'relative')}>
              <MoneyInput
                value={amount}
                onChange={(value) => onDraftChange(source.bonusEntryId, value)}
                disabled={disabled}
                placeholder={t('matrix.cell.sourceAmountPlaceholder')}
                aria-label={t('matrix.cell.sourceAmountAria', { title: sourceLabel(source) })}
                className={PAYROLL_MATRIX_CELL_MONEY_INPUT_CLASS}
                onFocus={onFocus}
                onKeyDown={onKeyDown}
              />
              <span
                className={cn(
                  PAYROLL_MATRIX_CELL_CURRENCY_SLOT_CLASS,
                  !showCurrency && 'invisible',
                )}
                aria-hidden
              >
                <AmdCurrencyIcon className="text-muted-foreground" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
