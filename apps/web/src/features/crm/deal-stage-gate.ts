import { getDealStageGateErrors, type DealStageGateInput } from '@nbos/shared';
import type { Deal } from '@/lib/api/deals';
import type { ApiFieldError } from '@/lib/api-errors';

export function getLocalDealStageGateErrors(deal: Deal, targetStatus: string): ApiFieldError[] {
  return getDealStageGateErrors(toDealStageGateInput(deal), targetStatus);
}

export function toDealStageGateInput(deal: Deal): DealStageGateInput {
  return {
    contactId: deal.contact?.id ?? null,
    type: deal.type,
    amount: deal.amount,
    paymentType: deal.paymentType,
    productCategory: deal.productCategory,
    productType: deal.productType,
    pmId: deal.pmId,
    deadline: deal.deadline,
    existingProductId: deal.existingProductId,
    companyId: deal.companyId ?? null,
    taxStatus: deal.taxStatus ?? null,
    offerLink: deal.offerLink,
    offerFileUrl: deal.offerFileUrl,
    offerScreenshotUrl: deal.offerScreenshotUrl,
    contractFileUrl: deal.contractFileUrl,
    linkedOfferAssetCount: deal.linkedOfferAssetCount ?? 0,
    linkedContractAssetCount: deal.linkedContractAssetCount ?? 0,
    notes: deal.notes,
    orders: deal.orders,
    source: deal.source,
    sourceDetail: deal.sourceDetail,
    sourcePartnerId: deal.sourcePartnerId,
    sourceContactId: deal.sourceContactId,
    marketingAccountId: deal.marketingAccountId,
    marketingActivityId: deal.marketingActivityId,
    partnerReferralTerms: deal.partnerReferralTerms ?? null,
  };
}
