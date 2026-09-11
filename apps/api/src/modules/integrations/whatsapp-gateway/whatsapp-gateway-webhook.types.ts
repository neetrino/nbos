export const WHATSAPP_GATEWAY_WEBHOOK_EVENT_TYPES = [
  'message.received',
  'message.ack',
  'message.reaction',
  'message.edited',
  'message.revoked',
  'session.status',
] as const;

export type WhatsAppGatewayWebhookEventType = (typeof WHATSAPP_GATEWAY_WEBHOOK_EVENT_TYPES)[number];

export type WhatsAppGatewayWebhookBody = {
  eventId?: unknown;
  accountId?: unknown;
  type?: unknown;
  timestamp?: unknown;
  data?: unknown;
};

export type NormalizedWhatsAppWebhook = {
  eventId: string;
  accountId: string;
  type: string;
  occurredAt: Date;
  chatId: string | null;
  providerMessageId: string | null;
  body: string;
  fromMe: boolean;
  senderName: string;
  ack: unknown;
  sessionStatus: string | null;
  chatName: string | null;
};

export function normalizeWhatsAppWebhookBody(
  body: WhatsAppGatewayWebhookBody,
): NormalizedWhatsAppWebhook | null {
  const eventId = asNonEmptyString(body.eventId);
  const accountId = asNonEmptyString(body.accountId);
  const type = asNonEmptyString(body.type);
  if (!eventId || !accountId || !type) return null;
  const data = asRecord(body.data);
  return {
    eventId,
    accountId,
    type,
    occurredAt: parseOccurredAt(body.timestamp),
    chatId: asNonEmptyString(data?.chatId),
    providerMessageId: asNonEmptyString(data?.messageId),
    body: typeof data?.body === 'string' ? data.body : '',
    fromMe: data?.fromMe === true,
    senderName:
      asNonEmptyString(data?.senderName) ?? asNonEmptyString(data?.notifyName) ?? 'WhatsApp',
    ack: data?.ack ?? data?.ackName,
    sessionStatus: asNonEmptyString(data?.status),
    chatName: asNonEmptyString(data?.chatName) ?? asNonEmptyString(data?.name),
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOccurredAt(value: unknown): Date {
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date();
}
