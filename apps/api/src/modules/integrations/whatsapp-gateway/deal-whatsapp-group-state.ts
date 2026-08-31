import type { DealWhatsAppBindingView, DealWhatsAppState } from './deal-whatsapp-group.types';

export function toDealBindingView(row: {
  id: string;
  groupChatId: string | null;
  groupName: string | null;
  status: DealWhatsAppBindingView['status'];
  lastSuccessfulSyncAt: Date | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
}): DealWhatsAppBindingView {
  return {
    id: row.id,
    groupChatId: row.groupChatId,
    groupName: row.groupName,
    status: row.status,
    lastSuccessfulSyncAt: row.lastSuccessfulSyncAt?.toISOString() ?? null,
    lastErrorCode: row.lastErrorCode,
    lastErrorMessage: row.lastErrorMessage,
  };
}

export function toDealWhatsAppState(input: {
  dealId: string;
  productId: string | null;
  source: DealWhatsAppState['source'];
  binding: DealWhatsAppBindingView | null;
}): DealWhatsAppState {
  const binding = input.binding;
  return {
    dealId: input.dealId,
    productId: input.productId,
    source: input.source,
    binding,
    latestOperation: binding
      ? {
          id: binding.id,
          type: input.source === 'DEAL' ? 'CREATE_DEAL_GROUP' : 'CREATE_PRODUCT_GROUP',
          status: binding.status,
          errorCode: binding.lastErrorCode,
          errorMessage: binding.lastErrorMessage,
          createdAt: new Date().toISOString(),
          completedAt: binding.status === 'ACTIVE' ? (binding.lastSuccessfulSyncAt ?? null) : null,
        }
      : null,
  };
}
