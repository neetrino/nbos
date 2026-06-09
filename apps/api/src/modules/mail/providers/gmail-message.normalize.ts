import type { gmail_v1 } from 'googleapis';
import { decodeBase64Url, parseAddressList } from './gmail-mime';
import type {
  NormalizedMessage,
  NormalizedRecipient,
  NormalizedRecipientKind,
} from './mail-provider-adapter';

type Payload = gmail_v1.Schema$MessagePart;

function headerValue(payload: Payload | undefined, name: string): string | null {
  const headers = payload?.headers ?? [];
  const found = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return found?.value ?? null;
}

function collectRecipients(payload: Payload | undefined): NormalizedRecipient[] {
  const mapping: Array<{ header: string; kind: NormalizedRecipientKind }> = [
    { header: 'From', kind: 'FROM' },
    { header: 'To', kind: 'TO' },
    { header: 'Cc', kind: 'CC' },
    { header: 'Bcc', kind: 'BCC' },
    { header: 'Reply-To', kind: 'REPLY_TO' },
  ];
  const recipients: NormalizedRecipient[] = [];
  for (const { header, kind } of mapping) {
    for (const addr of parseAddressList(headerValue(payload, header))) {
      recipients.push({ kind, email: addr.email, displayName: addr.name });
    }
  }
  return recipients;
}

function findPartBody(payload: Payload | undefined, mimeType: string): string | null {
  if (!payload) {
    return null;
  }
  if (payload.mimeType === mimeType && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  for (const part of payload.parts ?? []) {
    const found = findPartBody(part, mimeType);
    if (found) {
      return found;
    }
  }
  return null;
}

/** Normalizes a Gmail `users.messages.get` (format=full) resource into the shared shape. */
export function normalizeGmailMessage(message: gmail_v1.Schema$Message): NormalizedMessage {
  const payload = message.payload ?? undefined;
  const internalDate = message.internalDate ? new Date(Number(message.internalDate)) : null;
  return {
    providerMessageId: message.id ?? '',
    messageIdHeader: headerValue(payload, 'Message-ID'),
    providerThreadId: message.threadId ?? null,
    subject: headerValue(payload, 'Subject') ?? '(no subject)',
    bodyText: findPartBody(payload, 'text/plain'),
    bodyHtml: findPartBody(payload, 'text/html'),
    sentAt: internalDate,
    receivedAt: internalDate,
    direction: 'INBOUND',
    recipients: collectRecipients(payload),
  };
}
