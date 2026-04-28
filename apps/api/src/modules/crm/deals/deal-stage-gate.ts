import { BadRequestException } from '@nestjs/common';
import { validateAttributionGate } from '../attribution-gate';

interface DealForValidation {
  type: string;
  amount: unknown;
  paymentType: string | null;
  productCategory: string | null;
  productType: string | null;
  pmId: string | null;
  deadline: Date | null;
  existingProductId: string | null;
  source: string | null;
  sourceDetail: string | null;
  sourcePartnerId: string | null;
  sourceContactId: string | null;
  marketingAccountId: string | null;
  marketingActivityId: string | null;
}

interface ValidationError {
  field: string;
  message: string;
}

const STAGE_ORDER = [
  'START_CONVERSATION',
  'DISCUSS_NEEDS',
  'MEETING',
  'CAN_WE_DO_IT',
  'SEND_OFFER',
  'GET_ANSWER',
  'DEPOSIT_AND_CONTRACT',
  'WON',
] as const;

/**
 * Валидация обязательных полей при переходе Deal на определённую стадию.
 * Выбрасывает BadRequestException со списком отсутствующих полей.
 */
export function validateDealStageGate(deal: DealForValidation, targetStatus: string) {
  if (targetStatus === 'FAILED') return;

  const targetIdx = STAGE_ORDER.indexOf(targetStatus as (typeof STAGE_ORDER)[number]);
  if (targetIdx < 0) return;

  const errors: ValidationError[] = [];

  const isProductLike = deal.type === 'PRODUCT' || deal.type === 'OUTSOURCE';
  const isExtension = deal.type === 'EXTENSION';

  const reachesStage = (stage: string) =>
    targetIdx >= STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number]);

  if (reachesStage('DISCUSS_NEEDS')) {
    validateAttributionGate(deal, 'Deal', targetStatus);
  }

  if (reachesStage('SEND_OFFER')) {
    if (!deal.amount) {
      errors.push({ field: 'amount', message: 'Amount is required at SEND_OFFER' });
    }
    if (!deal.paymentType) {
      errors.push({ field: 'paymentType', message: 'Payment type is required at SEND_OFFER' });
    }
    if (isProductLike && !deal.productCategory) {
      errors.push({
        field: 'productCategory',
        message: 'Product category is required for PRODUCT/OUTSOURCE deals at SEND_OFFER',
      });
    }
    if (isProductLike && !deal.productType) {
      errors.push({
        field: 'productType',
        message: 'Product type is required for PRODUCT/OUTSOURCE deals at SEND_OFFER',
      });
    }
  }

  if (reachesStage('DEPOSIT_AND_CONTRACT')) {
    if (deal.type === 'PRODUCT') {
      if (!deal.pmId) {
        errors.push({
          field: 'pmId',
          message: 'PM is required for PRODUCT deals at DEPOSIT_AND_CONTRACT',
        });
      }
      if (!deal.deadline) {
        errors.push({
          field: 'deadline',
          message: 'Deadline is required for PRODUCT deals at DEPOSIT_AND_CONTRACT',
        });
      }
    }
    if (isExtension && !deal.existingProductId) {
      errors.push({
        field: 'existingProductId',
        message: 'Existing product must be selected for EXTENSION deals at DEPOSIT_AND_CONTRACT',
      });
    }
  }

  if (errors.length > 0) {
    throw new BadRequestException({
      statusCode: 400,
      code: 'STAGE_GATE_VALIDATION',
      message: `Cannot move to ${targetStatus}: missing required fields`,
      errors,
    });
  }
}
