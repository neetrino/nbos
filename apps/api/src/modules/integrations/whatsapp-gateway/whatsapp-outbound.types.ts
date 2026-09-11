export type WhatsAppFinanceOutboundKind =
  | 'official_send'
  | 'official_cancel'
  | 'payment_reminder'
  | 'overdue_reminder'
  | 'client_invite';

export type WhatsAppOutboundKind = WhatsAppFinanceOutboundKind | 'core_client_send';

export type WhatsAppFinanceOutboundJobPayload = {
  kind: WhatsAppFinanceOutboundKind;
  chatId: string;
  text: string;
  idempotencyKey: string;
  invoiceId?: string;
  notificationJobId?: string;
};

export type WhatsAppCoreSendJobPayload = {
  kind: 'core_client_send';
  chatId: string;
  accountId: string;
  messageId: string;
  conversationId: string;
  idempotencyKey: string;
};

export type WhatsAppOutboundJobPayload =
  | WhatsAppFinanceOutboundJobPayload
  | WhatsAppCoreSendJobPayload;
