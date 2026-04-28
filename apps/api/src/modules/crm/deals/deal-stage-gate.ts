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
  companyId?: string | null;
  taxStatus?: string | null;
  offerSentAt: Date | null;
  offerLink: string | null;
  offerFileUrl: string | null;
  offerScreenshotUrl: string | null;
  responseDueAt: Date | null;
  contractSignedAt: Date | null;
  contractFileUrl: string | null;
  orders?: Array<{ invoices?: unknown[] }>;
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
  const hasOfferProof = Boolean(deal.offerLink || deal.offerFileUrl || deal.offerScreenshotUrl);
  const hasContractProof = Boolean(deal.contractSignedAt || deal.contractFileUrl);
  const hasInvoice = deal.orders?.some((order) => (order.invoices?.length ?? 0) > 0) ?? false;

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
    if (!deal.offerSentAt) {
      errors.push({
        field: 'offerSentAt',
        message: 'Offer sent date is required at SEND_OFFER',
      });
    }
    if (!hasOfferProof) {
      errors.push({
        field: 'offerProof',
        message: 'Offer link, file URL, or screenshot URL is required at SEND_OFFER',
      });
    }
  }

  if (reachesStage('GET_ANSWER')) {
    if (!deal.responseDueAt) {
      errors.push({
        field: 'responseDueAt',
        message: 'Response deadline is required at GET_ANSWER',
      });
    }
  }

  if (reachesStage('DEPOSIT_AND_CONTRACT')) {
    if (deal.taxStatus === 'TAX' && !deal.companyId) {
      errors.push({
        field: 'companyId',
        message: 'Company is required for TAX deals at DEPOSIT_AND_CONTRACT',
      });
    }
    if (deal.paymentType === 'CLASSIC' && !hasContractProof) {
      errors.push({
        field: 'contractProof',
        message: 'Signed contract date or contract file URL is required at DEPOSIT_AND_CONTRACT',
      });
    }
    if (deal.paymentType === 'CLASSIC' && !hasInvoice) {
      errors.push({
        field: 'invoice',
        message: 'Deposit invoice must be created before DEPOSIT_AND_CONTRACT',
      });
    }
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
