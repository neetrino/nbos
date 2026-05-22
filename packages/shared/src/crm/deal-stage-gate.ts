import { DEAL_STAGE_GATE_ORDER } from '../constants/crm-attribution';
import { getAttributionValidationErrors, type AttributionForValidation } from './attribution-gate';

export type { StageGateError } from './attribution-gate';

export interface DealStageGateInput extends AttributionForValidation {
  contactId?: string | null;
  type: string | null;
  amount: unknown;
  paymentType: string | null;
  productCategory: string | null;
  productType: string | null;
  pmId: string | null;
  deadline: Date | string | null;
  existingProductId: string | null;
  companyId?: string | null;
  taxStatus?: string | null;
  offerLink?: string | null;
  offerFileUrl?: string | null;
  offerScreenshotUrl?: string | null;
  contractFileUrl?: string | null;
  linkedOfferAssetCount?: number;
  linkedContractAssetCount?: number;
  notes?: string | null;
  orders?: Array<{ invoices?: unknown[] }>;
  partnerReferralTerms?: { id: string } | null;
}

function hasNonBlankValue(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function hasOfferProof(deal: DealStageGateInput): boolean {
  return Boolean(
    (deal.linkedOfferAssetCount ?? 0) > 0 ||
    hasNonBlankValue(deal.offerLink ?? null) ||
    hasNonBlankValue(deal.offerFileUrl ?? null) ||
    hasNonBlankValue(deal.offerScreenshotUrl ?? null),
  );
}

function hasContractProof(deal: DealStageGateInput): boolean {
  return Boolean(
    (deal.linkedContractAssetCount ?? 0) > 0 || hasNonBlankValue(deal.contractFileUrl ?? null),
  );
}

/**
 * Returns missing field / blocker errors for a deal stage transition (cumulative gates).
 */
export function getDealStageGateErrors(
  deal: DealStageGateInput,
  targetStatus: string,
): import('./attribution-gate').StageGateError[] {
  if (targetStatus === 'FAILED') {
    if (!hasNonBlankValue(deal.notes ?? null)) {
      return [
        {
          field: 'notes',
          message: 'Lost reason is required when marking a deal as Failed',
        },
      ];
    }
    return [];
  }

  const targetIdx = DEAL_STAGE_GATE_ORDER.indexOf(
    targetStatus as (typeof DEAL_STAGE_GATE_ORDER)[number],
  );
  if (targetIdx < 0) return [];

  const errors: import('./attribution-gate').StageGateError[] = [];
  const dealType = deal.type;
  const isProductLike = dealType === 'PRODUCT' || dealType === 'OUTSOURCE';
  const isExtension = dealType === 'EXTENSION';
  const hasInvoice = deal.orders?.some((order) => (order.invoices?.length ?? 0) > 0) ?? false;

  const reachesStage = (stage: string) =>
    targetIdx >= DEAL_STAGE_GATE_ORDER.indexOf(stage as (typeof DEAL_STAGE_GATE_ORDER)[number]);

  if (reachesStage('DISCUSS_NEEDS')) {
    if (!hasNonBlankValue(deal.contactId ?? null)) {
      errors.push({ field: 'contactId', message: 'Contact is required at DISCUSS_NEEDS' });
    }
    if (!dealType) {
      errors.push({ field: 'type', message: 'Deal type is required at DISCUSS_NEEDS' });
    }
    if (!deal.taxStatus) {
      errors.push({ field: 'taxStatus', message: 'Tax status is required at DISCUSS_NEEDS' });
    }
    errors.push(...getAttributionValidationErrors(deal));
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
    if (!hasOfferProof(deal)) {
      errors.push({
        field: 'offerProof',
        message: 'Attach at least one offer file in Drive before SEND_OFFER',
      });
    }
    if (deal.source === 'PARTNER') {
      if (!deal.sourcePartnerId) {
        errors.push({
          field: 'sourcePartnerId',
          message: 'Partner is required when source is Partner at SEND_OFFER',
        });
      } else if (!deal.partnerReferralTerms) {
        errors.push({
          field: 'partnerReferralTerms',
          message: 'Partner referral terms must be synced before SEND_OFFER',
        });
      }
    }
  }

  if (reachesStage('DEPOSIT_AND_CONTRACT')) {
    if (deal.taxStatus === 'TAX' && !deal.companyId) {
      errors.push({
        field: 'companyId',
        message: 'Company is required for TAX deals at DEPOSIT_AND_CONTRACT',
      });
    }
    if (deal.paymentType === 'CLASSIC' && !hasContractProof(deal)) {
      errors.push({
        field: 'contractProof',
        message: 'Attach a signed contract file in Drive before DEPOSIT_AND_CONTRACT',
      });
    }
    if (deal.paymentType === 'CLASSIC' && !hasInvoice) {
      errors.push({
        field: 'invoice',
        message: 'Deposit invoice must be created before DEPOSIT_AND_CONTRACT',
      });
    }
    if (dealType === 'PRODUCT') {
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

  return errors;
}
