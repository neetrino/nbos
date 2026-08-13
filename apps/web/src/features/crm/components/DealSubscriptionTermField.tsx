'use client';

import { CalendarDays } from 'lucide-react';
import { SUBSCRIPTION_TERM_MONTHS_MAX, SUBSCRIPTION_TERM_MONTHS_MIN } from '@nbos/shared';
import { DetailSheetFieldSegmented, InlineField } from '@/components/shared';
import { formatAmount } from '../constants/dealPipeline';
import { deriveDealSubscriptionContractTotal } from '@/features/crm/utils/deal-subscription-contract-total';
import { DEAL_SUBSCRIPTION_TERM_PRESET_OPTIONS } from '@/features/crm/constants/deal-subscription-term';
import { dealStageGateFieldClass } from '@/features/crm/deal-stage-gate-highlight';
import type { DealGeneralDraft } from './deal-general-form-state';

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

function presetValueForTerm(termMonths: number | null): string | null {
  if (termMonths == null) return null;
  const preset = DEAL_SUBSCRIPTION_TERM_PRESET_OPTIONS.find(
    (option) => Number(option.value) === termMonths,
  );
  return preset?.value ?? null;
}

/** Fixed subscription term (months) for PRODUCT/EXTENSION + SUBSCRIPTION deals. */
export function DealSubscriptionTermField({
  draft,
  patchDraft,
  disabled = false,
  gateRequiredFields = new Set(),
}: DealSubscriptionTermFieldProps) {
  const gateClass = dealStageGateFieldClass(gateRequiredFields, 'subscriptionTermMonths');
  const presetValue = presetValueForTerm(draft.subscriptionTermMonths);
  const contractTotal = deriveDealSubscriptionContractTotal(
    draft.amount,
    draft.subscriptionTermMonths,
  );

  return (
    <>
      <DetailSheetFieldSegmented
        label="Term presets"
        icon={<CalendarDays size={12} />}
        value={presetValue}
        options={DEAL_SUBSCRIPTION_TERM_PRESET_OPTIONS}
        disabled={disabled}
        className={gateClass}
        ariaLabel="Subscription term presets"
        onValueChange={(value) => patchDraft({ subscriptionTermMonths: Number(value) })}
      />
      <InlineField
        variant="controlled"
        label={`Subscription term (${SUBSCRIPTION_TERM_MONTHS_MIN}–${SUBSCRIPTION_TERM_MONTHS_MAX} mo)`}
        type="number"
        value={draft.subscriptionTermMonths ?? ''}
        placeholder={`${SUBSCRIPTION_TERM_MONTHS_MIN}–${SUBSCRIPTION_TERM_MONTHS_MAX}`}
        icon={<CalendarDays size={12} />}
        disabled={disabled}
        className={gateClass}
        onValueChange={(value) =>
          patchDraft({ subscriptionTermMonths: parseTermMonthsInput(value) })
        }
      />
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
  if (draft.paymentType !== 'SUBSCRIPTION') return false;
  return draft.type === 'PRODUCT' || draft.type === 'EXTENSION';
}

export function dealAmountFieldLabel(paymentType: string | null): string {
  return paymentType === 'SUBSCRIPTION' ? 'Amount / month' : 'Cost';
}
