import type { Deal } from '@/lib/api/deals';
import { toDateInputValue } from './deal-general-tab.helpers';

/** Editable General tab state (includes UI labels for search fields). */
export interface DealGeneralDraft {
  name: string | null;
  amount: number | null;
  paymentType: string | null;
  taxStatus: string;
  projectId: string | null;
  linkedProjectLabel: string | null;
  isNewProject: boolean;
  type: string;
  maintenanceStartAt: string | null;
  productCategory: string | null;
  productType: string | null;
  existingProductId: string | null;
  existingProductPickLabel: string | null;
  companyId: string | null;
  companyPickLabel: string | null;
  offerSentAt: string | null;
  responseDueAt: string | null;
  offerLink: string | null;
  offerFileUrl: string | null;
  offerScreenshotUrl: string | null;
  contractSignedAt: string | null;
  contractFileUrl: string | null;
  source: string | null;
  sourceDetail: string | null;
  sourcePartnerId: string | null;
  sourceContactId: string | null;
  marketingAccountId: string | null;
  marketingActivityId: string | null;
  marketingPickLabel: string | null;
  partnerPickLabel: string | null;
  clientPickLabel: string | null;
  notes: string | null;
  contactId: string | null;
  contactDisplayLabel: string | null;
  sellerId: string | null;
  sellerDisplayLabel: string | null;
  sellerAssistantId: string | null;
  sellerAssistantDisplayLabel: string | null;
}

/** Payload allowed by PUT /deals/:id (includes ids not on Deal view model). */
export type DealGeneralUpdatePayload = Partial<Deal> & {
  contactId?: string | null;
  sellerId?: string | null;
};

export function createDealGeneralDraft(deal: Deal): DealGeneralDraft {
  return {
    name: deal.name,
    amount: deal.amount,
    paymentType: deal.paymentType,
    taxStatus: deal.taxStatus ?? 'TAX',
    projectId: deal.projectId,
    linkedProjectLabel: deal.handoff?.project?.name ?? null,
    isNewProject: false,
    type: deal.type,
    maintenanceStartAt: toDateInputValue(deal.maintenanceStartAt),
    productCategory: deal.productCategory,
    productType: deal.productType,
    existingProductId: deal.existingProductId,
    existingProductPickLabel: deal.existingProduct?.name ?? null,
    companyId: deal.companyId ?? null,
    companyPickLabel: deal.company?.name ?? null,
    offerSentAt: toDateInputValue(deal.offerSentAt),
    responseDueAt: toDateInputValue(deal.responseDueAt),
    offerLink: deal.offerLink,
    offerFileUrl: deal.offerFileUrl,
    offerScreenshotUrl: deal.offerScreenshotUrl,
    contractSignedAt: toDateInputValue(deal.contractSignedAt),
    contractFileUrl: deal.contractFileUrl,
    source: deal.source,
    sourceDetail: deal.sourceDetail,
    sourcePartnerId: deal.sourcePartnerId,
    sourceContactId: deal.sourceContactId,
    marketingAccountId: deal.marketingAccountId,
    marketingActivityId: deal.marketingActivityId,
    marketingPickLabel: deal.marketingAccount?.name ?? deal.marketingActivity?.title ?? null,
    partnerPickLabel: deal.sourcePartner?.name ?? null,
    clientPickLabel: deal.sourceContact
      ? `${deal.sourceContact.firstName} ${deal.sourceContact.lastName}`
      : null,
    notes: deal.notes,
    contactId: deal.contact?.id ?? null,
    contactDisplayLabel: deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : null,
    sellerId: deal.seller?.id ?? null,
    sellerDisplayLabel: deal.seller ? `${deal.seller.firstName} ${deal.seller.lastName}` : null,
    sellerAssistantId: deal.sellerAssistant?.id ?? null,
    sellerAssistantDisplayLabel: deal.sellerAssistant
      ? `${deal.sellerAssistant.firstName} ${deal.sellerAssistant.lastName}`
      : null,
  };
}

function dateOrNull(v: string | null): string | null {
  if (!v || !String(v).trim()) return null;
  return v;
}

export function buildDealGeneralPatch(
  snap: DealGeneralDraft,
  draft: DealGeneralDraft,
): DealGeneralUpdatePayload {
  const out: DealGeneralUpdatePayload = {};

  if (draft.name !== snap.name) out.name = draft.name;
  if (draft.amount !== snap.amount) out.amount = draft.amount;
  if (draft.paymentType !== snap.paymentType) out.paymentType = draft.paymentType;
  if (draft.taxStatus !== snap.taxStatus) out.taxStatus = draft.taxStatus;
  if (draft.projectId !== snap.projectId) out.projectId = draft.projectId;
  if (draft.type !== snap.type) out.type = draft.type;
  if (dateOrNull(draft.maintenanceStartAt) !== dateOrNull(snap.maintenanceStartAt)) {
    out.maintenanceStartAt = dateOrNull(draft.maintenanceStartAt);
  }
  if (draft.productCategory !== snap.productCategory) {
    out.productCategory = draft.productCategory;
    out.productType = draft.productType;
  } else if (draft.productType !== snap.productType) {
    out.productType = draft.productType;
  }
  if (draft.existingProductId !== snap.existingProductId) {
    out.existingProductId = draft.existingProductId;
  }
  if (draft.companyId !== snap.companyId) out.companyId = draft.companyId;

  if (dateOrNull(draft.offerSentAt) !== dateOrNull(snap.offerSentAt)) {
    out.offerSentAt = dateOrNull(draft.offerSentAt);
  }
  if (dateOrNull(draft.responseDueAt) !== dateOrNull(snap.responseDueAt)) {
    out.responseDueAt = dateOrNull(draft.responseDueAt);
  }
  if (draft.offerLink !== snap.offerLink) out.offerLink = draft.offerLink;
  if (draft.offerFileUrl !== snap.offerFileUrl) out.offerFileUrl = draft.offerFileUrl;
  if (draft.offerScreenshotUrl !== snap.offerScreenshotUrl) {
    out.offerScreenshotUrl = draft.offerScreenshotUrl;
  }
  if (dateOrNull(draft.contractSignedAt) !== dateOrNull(snap.contractSignedAt)) {
    out.contractSignedAt = dateOrNull(draft.contractSignedAt);
  }
  if (draft.contractFileUrl !== snap.contractFileUrl) {
    out.contractFileUrl = draft.contractFileUrl;
  }

  if (draft.source !== snap.source) out.source = draft.source;
  if (draft.sourceDetail !== snap.sourceDetail) out.sourceDetail = draft.sourceDetail;
  if (draft.sourcePartnerId !== snap.sourcePartnerId) {
    out.sourcePartnerId = draft.sourcePartnerId;
  }
  if (draft.sourceContactId !== snap.sourceContactId) {
    out.sourceContactId = draft.sourceContactId;
  }
  if (draft.marketingAccountId !== snap.marketingAccountId) {
    out.marketingAccountId = draft.marketingAccountId;
  }
  if (draft.marketingActivityId !== snap.marketingActivityId) {
    out.marketingActivityId = draft.marketingActivityId;
  }

  if (draft.notes !== snap.notes) out.notes = draft.notes;

  if (draft.contactId !== snap.contactId) out.contactId = draft.contactId;
  if (draft.sellerId !== snap.sellerId) out.sellerId = draft.sellerId;
  if (draft.sellerAssistantId !== snap.sellerAssistantId) {
    out.sellerAssistantId = draft.sellerAssistantId;
  }

  return out;
}

export function isDealGeneralDirty(a: DealGeneralDraft, b: DealGeneralDraft): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}
