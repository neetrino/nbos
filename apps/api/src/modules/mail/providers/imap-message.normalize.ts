import type { AddressObject, ParsedMail } from 'mailparser';
import type {
  NormalizedMessage,
  NormalizedRecipient,
  NormalizedRecipientKind,
} from './mail-provider-adapter';

function mapAddresses(
  kind: NormalizedRecipientKind,
  source: AddressObject | AddressObject[] | undefined,
): NormalizedRecipient[] {
  if (!source) {
    return [];
  }
  const objects = Array.isArray(source) ? source : [source];
  const recipients: NormalizedRecipient[] = [];
  for (const obj of objects) {
    for (const addr of obj.value) {
      if (!addr.address) {
        continue;
      }
      recipients.push({ kind, email: addr.address, displayName: addr.name || null });
    }
  }
  return recipients;
}

function resolveProviderThreadId(parsed: ParsedMail): string | null {
  const references = parsed.references;
  if (Array.isArray(references) && references.length > 0) {
    return references[0] ?? null;
  }
  if (typeof references === 'string' && references.length > 0) {
    return references;
  }
  return parsed.messageId ?? null;
}

/** Normalizes a parsed IMAP RFC822 message into the shared NBOS message shape. */
export function normalizeParsedMail(parsed: ParsedMail, uid: number): NormalizedMessage {
  const recipients: NormalizedRecipient[] = [
    ...mapAddresses('FROM', parsed.from),
    ...mapAddresses('TO', parsed.to),
    ...mapAddresses('CC', parsed.cc),
    ...mapAddresses('BCC', parsed.bcc),
    ...mapAddresses('REPLY_TO', parsed.replyTo),
  ];
  const receivedAt = parsed.date ?? new Date();
  return {
    providerMessageId: String(uid),
    messageIdHeader: parsed.messageId ?? null,
    providerThreadId: resolveProviderThreadId(parsed),
    subject: parsed.subject ?? '(no subject)',
    bodyText: parsed.text ?? null,
    bodyHtml: typeof parsed.html === 'string' ? parsed.html : null,
    sentAt: parsed.date ?? null,
    receivedAt,
    direction: 'INBOUND',
    recipients,
  };
}
