export type WhatsAppOutboundKind =
  | 'official_send'
  | 'official_cancel'
  | 'payment_reminder'
  | 'overdue_reminder'
  | 'client_invite';

export interface WhatsAppOutboundJobPayload {
  kind: WhatsAppOutboundKind;
  chatId: string;
  text: string;
  idempotencyKey: string;
  invoiceId?: string;
  notificationJobId?: string;
}
