import { formatAmount } from '@/features/finance/constants/finance';
import {
  parseCoverageMonthCount,
  type SubscriptionFormState,
} from '@/features/finance/utils/subscription-form-state';

const MONTHLY_COVERAGE_MONTHS = 1;
const YEARLY_COVERAGE_MONTHS = 12;

function resolveBillingCoverageMonths(
  billingFrequency: string,
  coverageMonthCount: string,
): number {
  if (billingFrequency === 'MONTHLY') return MONTHLY_COVERAGE_MONTHS;
  if (billingFrequency === 'YEARLY') return YEARLY_COVERAGE_MONTHS;
  return parseCoverageMonthCount(coverageMonthCount) ?? 0;
}

export function hasSubscriptionBillingPeriodChanged(
  snap: Pick<SubscriptionFormState, 'billingFrequency' | 'coverageMonthCount'>,
  draft: Pick<SubscriptionFormState, 'billingFrequency' | 'coverageMonthCount'>,
): boolean {
  if (draft.billingFrequency !== snap.billingFrequency) return true;
  if (draft.billingFrequency !== 'CUSTOM') return false;
  return draft.coverageMonthCount !== snap.coverageMonthCount;
}

export function computePeriodAmountFromMonthlyEquivalent(
  monthlyEquivalent: number,
  billingFrequency: string,
  coverageMonthCount: string,
): number | null {
  const months = resolveBillingCoverageMonths(billingFrequency, coverageMonthCount);
  if (months <= 0 || !Number.isFinite(monthlyEquivalent) || monthlyEquivalent <= 0) {
    return null;
  }
  return monthlyEquivalent * months;
}

function formatProposedPeriodAmount(
  monthlyEquivalent: number,
  billingFrequency: string,
  coverageMonthCount: string,
): string {
  const amount = computePeriodAmountFromMonthlyEquivalent(
    monthlyEquivalent,
    billingFrequency,
    coverageMonthCount,
  );
  return amount != null ? String(amount) : '';
}

export function applyBillingPeriodChangeToDraft(
  draft: SubscriptionFormState,
  changes: Partial<Pick<SubscriptionFormState, 'billingFrequency' | 'coverageMonthCount'>>,
  monthlyEquivalentAmount: number,
): SubscriptionFormState {
  const billingFrequency = changes.billingFrequency ?? draft.billingFrequency;
  let coverageMonthCount = draft.coverageMonthCount;
  if (changes.billingFrequency != null) {
    coverageMonthCount = billingFrequency === 'CUSTOM' ? draft.coverageMonthCount : '';
  }
  if (changes.coverageMonthCount != null) {
    coverageMonthCount = changes.coverageMonthCount;
  }

  const next: SubscriptionFormState = {
    ...draft,
    ...changes,
    billingFrequency,
    coverageMonthCount,
  };
  const proposed = formatProposedPeriodAmount(
    monthlyEquivalentAmount,
    next.billingFrequency,
    next.coverageMonthCount,
  );
  if (proposed) next.amount = proposed;
  return next;
}

function describeBillingPeriod(
  state: Pick<SubscriptionFormState, 'billingFrequency' | 'coverageMonthCount'>,
): string {
  if (state.billingFrequency === 'YEARLY') return 'Yearly';
  if (state.billingFrequency === 'CUSTOM') {
    const months = parseCoverageMonthCount(state.coverageMonthCount);
    return months != null ? `Custom (${months} months)` : 'Custom';
  }
  return 'Monthly';
}

export function buildBillingPeriodChangeConfirmDescription(
  snap: Pick<SubscriptionFormState, 'billingFrequency' | 'coverageMonthCount' | 'amount'>,
  draft: Pick<SubscriptionFormState, 'billingFrequency' | 'coverageMonthCount' | 'amount'>,
  monthlyEquivalentAmount: string,
): string {
  const mrr = formatAmount(parseFloat(monthlyEquivalentAmount));
  const newAmount = formatAmount(parseFloat(draft.amount.replace(/\s/g, '')));
  const oldAmount = formatAmount(parseFloat(snap.amount.replace(/\s/g, '')));
  return (
    `Billing period changes from ${describeBillingPeriod(snap)} (${oldAmount}) to ` +
    `${describeBillingPeriod(draft)} (${newAmount}). Monthly equivalent stays at ${mrr}/mo equiv.`
  );
}
