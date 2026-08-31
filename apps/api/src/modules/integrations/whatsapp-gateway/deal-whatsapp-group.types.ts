import type { ProductWhatsAppGroupBindingStatusEnum } from '@nbos/database';

export const DEAL_WHATSAPP_CREATE_JOB_KIND = 'DEAL_CREATE' as const;

export const DEAL_WHATSAPP_CREATE_TYPES = new Set(['PRODUCT', 'OUTSOURCE']);

export const DEAL_WHATSAPP_CREATE_SATISFIER_STATUSES = new Set<string>([
  'PENDING',
  'CREATING',
  'FAILED',
  'OUTCOME_UNKNOWN',
  'NEEDS_RECONCILIATION',
]);

export type DealWhatsAppBindingView = {
  id: string;
  groupChatId: string | null;
  groupName: string | null;
  status: ProductWhatsAppGroupBindingStatusEnum;
  lastSuccessfulSyncAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
};

export type DealWhatsAppState = {
  dealId: string;
  productId: string | null;
  source: 'DEAL' | 'PRODUCT';
  binding: DealWhatsAppBindingView | null;
  latestOperation: {
    id: string;
    type: string;
    status: string;
    errorCode: string | null;
    errorMessage: string | null;
    createdAt: string;
    completedAt: string | null;
  } | null;
};

export type DealWhatsAppCreateJobPayload = {
  kind: typeof DEAL_WHATSAPP_CREATE_JOB_KIND;
  bindingId: string;
};
