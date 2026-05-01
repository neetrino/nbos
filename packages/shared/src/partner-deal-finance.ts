import { BONUS_PERCENTAGES } from './constants';

export type PartnerDealFinancePreviewInput = {
  amount: number;
  paymentType: string | null | undefined;
  dealSource: string | null | undefined;
  partnerDefaultPercent?: number | string | null | undefined;
};

export type PartnerDealFinancePreview = {
  total: number;
  partnerAmount: number;
  revenue: number;
  isFromPartner: boolean;
  /** Effective commission when `dealSource === 'PARTNER'`; otherwise `0`. */
  commissionPercentUsed: number;
};

function resolvePartnerCommissionPercent(
  partnerDefaultPercent: number | string | null | undefined,
): number {
  if (partnerDefaultPercent === null || partnerDefaultPercent === undefined) {
    return BONUS_PERCENTAGES.PARTNER_DEFAULT;
  }
  const n = Number(partnerDefaultPercent);
  if (Number.isNaN(n) || n < 0 || n > 100) {
    return BONUS_PERCENTAGES.PARTNER_DEFAULT;
  }
  return n;
}

/**
 * Mirrors CRM deal finance preview: subscription total is 12× monthly amount;
 * partner share applies to the base period amount (same rule as legacy UI).
 */
export function computePartnerDealFinancePreview(
  input: PartnerDealFinancePreviewInput,
): PartnerDealFinancePreview {
  const amount = Number.isFinite(input.amount) ? input.amount : 0;
  const isSubscription = input.paymentType === 'SUBSCRIPTION';
  const total = isSubscription ? amount * 12 : amount;
  const isFromPartner = input.dealSource === 'PARTNER';
  const commissionPercentUsed = isFromPartner
    ? resolvePartnerCommissionPercent(input.partnerDefaultPercent)
    : 0;
  const partnerAmount = isFromPartner ? Math.round(amount * (commissionPercentUsed / 100)) : 0;
  const revenue = total - partnerAmount;

  return {
    total,
    partnerAmount,
    revenue,
    isFromPartner,
    commissionPercentUsed,
  };
}
