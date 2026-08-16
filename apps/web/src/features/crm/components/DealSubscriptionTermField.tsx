'use client';

import { SUBSCRIPTION_TERM_MONTHS_MAX, SUBSCRIPTION_TERM_MONTHS_MIN } from '@nbos/shared';
import { InlineField } from '@/components/shared';
import {
  DETAIL_SHEET_FIELD_SEGMENTED_BUTTON_CLASS,
  DETAIL_SHEET_FIELD_SEGMENTED_GROUP_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { formatAmount } from '../constants/dealPipeline';
import { deriveDealSubscriptionContractTotal } from '@/features/crm/utils/deal-subscription-contract-total';
import { DEAL_SUBSCRIPTION_TERM_ANNUAL_MONTHS } from '@/features/crm/constants/deal-subscription-term';
import { dealStageGateFieldClass } from '@/features/crm/deal-stage-gate-highlight';
import { cn } from '@/lib/utils';
import type { DealGeneralDraft } from './deal-general-form-state';

/** Compact width for Annual pill and months field (2–3 digit values). */
const DEAL_SUBSCRIPTION_TERM_CONTROL_WIDTH_REM = '7.5rem';
const DEAL_SUBSCRIPTION_TERM_FIELD_WIDTH_CLASS = 'w-[7.5rem]';
const DEAL_SUBSCRIPTION_TERM_ANNUAL_MIN_WIDTH_CLASS = 'min-w-[7.5rem]';

interface DealSubscriptionTermFieldProps {
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  disabled?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
}

function parseTermMonthsInput(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  if (parsed < SUBSCRIPTION_TERM_MONTHS_MIN || parsed > SUBSCRIPTION_TERM_MONTHS_MAX) {
    return null;
  }
  return parsed;
}

/** Fixed subscription term (months) for SUBSCRIPTION deals. */
export function DealSubscriptionTermField({
  draft,
  patchDraft,
  disabled = false,
  gateRequiredFields = new Set(),
}: DealSubscriptionTermFieldProps) {
  const gateClass = dealStageGateFieldClass(gateRequiredFields, 'subscriptionTermMonths');
  const isAnnual = draft.subscriptionTermMonths === DEAL_SUBSCRIPTION_TERM_ANNUAL_MONTHS;
  const contractTotal = deriveDealSubscriptionContractTotal(
    draft.amount,
    draft.subscriptionTermMonths,
  );

  return (
    <>
      <div className={cn('flex flex-nowrap items-end gap-2', gateClass)}>
        <div className="shrink-0 pt-2">
          <div
            className={cn(
              DETAIL_SHEET_FIELD_SEGMENTED_GROUP_CLASS,
              'w-auto shrink-0',
              DEAL_SUBSCRIPTION_TERM_ANNUAL_MIN_WIDTH_CLASS,
            )}
          >
            <button
              type="button"
              aria-pressed={isAnnual}
              disabled={disabled}
              onClick={() =>
                patchDraft({ subscriptionTermMonths: DEAL_SUBSCRIPTION_TERM_ANNUAL_MONTHS })
              }
              className={cn(
                DETAIL_SHEET_FIELD_SEGMENTED_BUTTON_CLASS,
                'w-full flex-none px-5',
                isAnnual
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground/85 hover:bg-muted/80 hover:text-foreground',
                disabled && 'pointer-events-none opacity-60',
              )}
            >
              Annual
            </button>
          </div>
        </div>
        <InlineField
          variant="controlled"
          label={`Term (${SUBSCRIPTION_TERM_MONTHS_MIN}–${SUBSCRIPTION_TERM_MONTHS_MAX} mo)`}
          type="text"
          value={draft.subscriptionTermMonths ?? ''}
          placeholder="e.g. 12"
          disabled={disabled}
          className={cn('shrink-0', DEAL_SUBSCRIPTION_TERM_FIELD_WIDTH_CLASS)}
          onValueChange={(value) =>
            patchDraft({ subscriptionTermMonths: parseTermMonthsInput(value) })
          }
        />
      </div>
      {contractTotal != null ? (
        <div className="text-sm">
          <div className="text-foreground/85 mb-1.5 font-medium">Contract total</div>
          <div className="text-muted-foreground bg-muted/30 border-border rounded-md border px-3 py-2 tabular-nums">
            {formatAmount(contractTotal)}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function showDealSubscriptionTermFields(draft: DealGeneralDraft): boolean {
  return draft.paymentType === 'SUBSCRIPTION';
}

export function dealAmountFieldLabel(paymentType: string | null): string {
  return paymentType === 'SUBSCRIPTION' ? 'Amount / month' : 'Cost';
}
