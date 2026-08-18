export const WHATSAPP_WON_GATE_DEAL_TYPES = new Set(['PRODUCT', 'OUTSOURCE']);

export const CREATE_PRODUCT_GROUP_OP_STATUSES = new Set([
  'PENDING',
  'QUEUED',
  'PROCESSING',
  'CREATING',
  'FAILED',
  'SUCCEEDED',
  'OUTCOME_UNKNOWN',
]);

export type DealWonWhatsAppSessionAction = 'create' | 'bind';

export type DealWonWhatsAppPayload = {
  action: DealWonWhatsAppSessionAction;
  groupChatId?: string;
};

export function isWhatsAppWonGateDealType(dealType: string | null | undefined): boolean {
  return Boolean(dealType && WHATSAPP_WON_GATE_DEAL_TYPES.has(dealType));
}

export function hasExistingWhatsAppWonSatisfier(input: {
  groupChatId?: string | null;
  createOperationStatus?: string | null;
}): boolean {
  if (input.groupChatId) return true;
  if (!input.createOperationStatus) return false;
  return CREATE_PRODUCT_GROUP_OP_STATUSES.has(input.createOperationStatus);
}

export function canConfirmDealWonWhatsApp(input: {
  dealType: string | null | undefined;
  groupChatId?: string | null;
  createOperationStatus?: string | null;
  sessionAction?: DealWonWhatsAppSessionAction | null;
}): boolean {
  if (!isWhatsAppWonGateDealType(input.dealType)) return true;
  if (hasExistingWhatsAppWonSatisfier(input)) return true;
  return input.sessionAction === 'create' || input.sessionAction === 'bind';
}

export function isMissingActiveWhatsAppGroup(input: {
  bindingStatus?: string | null;
  groupChatId?: string | null;
}): boolean {
  return input.bindingStatus !== 'ACTIVE' || !input.groupChatId;
}

export function whatsappGroupMissingLabel(bindingStatus?: string | null): string {
  if (bindingStatus === 'FAILED') return 'WhatsApp group failed';
  if (bindingStatus === 'PENDING' || bindingStatus === 'CREATING') {
    return 'WhatsApp group pending';
  }
  if (bindingStatus === 'OUTCOME_UNKNOWN' || bindingStatus === 'NEEDS_RECONCILIATION') {
    return 'WhatsApp group unresolved';
  }
  return 'WhatsApp group not created';
}
