import { DEAL_STAGE_GATE_ORDER } from '@nbos/shared';
import type { Deal } from '@/lib/api/deals';
import type { ApiFieldError } from '@/lib/api-errors';

const TERM_REQUIRED_DEAL_TYPES = new Set(['PRODUCT', 'EXTENSION']);

/** Mirrors API SEND_OFFER gate for fixed-term subscription deals. */
export function getDealSubscriptionTermGateErrors(
  deal: Deal,
  targetStatus: string,
): ApiFieldError[] {
  const targetIdx = DEAL_STAGE_GATE_ORDER.indexOf(
    targetStatus as (typeof DEAL_STAGE_GATE_ORDER)[number],
  );
  if (targetIdx < 0) return [];

  const sendOfferIdx = DEAL_STAGE_GATE_ORDER.indexOf('SEND_OFFER');
  if (targetIdx < sendOfferIdx) return [];

  if (deal.paymentType !== 'SUBSCRIPTION') return [];
  if (!deal.type || !TERM_REQUIRED_DEAL_TYPES.has(deal.type)) return [];

  if (deal.subscriptionTermMonths == null) {
    return [
      {
        field: 'subscriptionTermMonths',
        message:
          'Subscription term (months) is required for PRODUCT/EXTENSION subscription deals at SEND_OFFER',
      },
    ];
  }
  return [];
}
