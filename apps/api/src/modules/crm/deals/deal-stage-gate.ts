import { BadRequestException } from '@nestjs/common';
import {
  DEAL_STAGE_GATE_ORDER,
  getDealStageGateErrors,
  type DealStageGateInput,
  type StageGateError,
} from '@nbos/shared';

export type { DealStageGateInput };

/** Deal types that require a fixed subscription term when payment is SUBSCRIPTION. */
const TERM_REQUIRED_DEAL_TYPES = new Set(['PRODUCT', 'EXTENSION']);

export interface CrmDealStageGateInput extends DealStageGateInput {
  subscriptionTermMonths?: number | null;
}

/**
 * Validates required fields when moving a Deal to a target stage.
 * @throws BadRequestException with field errors when validation fails
 */
export function validateDealStageGate(deal: CrmDealStageGateInput, targetStatus: string) {
  const errors = [
    ...getDealStageGateErrors(deal, targetStatus),
    ...getSubscriptionTermGateErrors(deal, targetStatus),
  ];
  if (errors.length === 0) return;

  throw new BadRequestException({
    statusCode: 400,
    code: 'STAGE_GATE_VALIDATION',
    message: `Cannot move to ${targetStatus}: missing required fields`,
    errors,
  });
}

/**
 * At SEND_OFFER (same gate as amount/paymentType), PRODUCT/EXTENSION + SUBSCRIPTION
 * require `subscriptionTermMonths`. MAINTENANCE and OUTSOURCE stay open-ended.
 */
function getSubscriptionTermGateErrors(
  deal: CrmDealStageGateInput,
  targetStatus: string,
): StageGateError[] {
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
