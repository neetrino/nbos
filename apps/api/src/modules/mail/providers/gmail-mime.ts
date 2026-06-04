import type { SendMessageInput } from './mail-provider-adapter';

export interface ParsedAddress {
  email: string;
  name: string | null;
}

/** Minimal RFC5322 address-list parser (Name <email>, email, comma-separated). */
export function parseAddressList(value: string | undefined | null): ParsedAddress[] {
  if (!value) {
    return [];
  }
  const parts = value.split(',');
  const result: ParsedAddress[] = [];
  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (!part) {
      continue;
    }
    const angle = part.match(/^(.*)<([^>]+)>$/);
    if (angle) {
      const name = angle[1]?.trim().replace(/^"|"$/g, '') ?? '';
      result.push({ email: angle[2]!.trim(), name: name || null });
      continue;
    }
    result.push({ email: part, name: null });
  }
  return result;
}

export function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf8');
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromHeader(input: SendMessageInput): string {
  return input.fromName ? `${input.fromName} <${input.fromEmail}>` : input.fromEmail;
}

/** Builds a base64url-encoded RFC822 message for `gmail.users.messages.send`. */
export function buildRawGmailMessage(input: SendMessageInput): string {
  const headers: string[] = [`From: ${fromHeader(input)}`, `To: ${input.to.join(', ')}`];
  if (input.cc.length) {
    headers.push(`Cc: ${input.cc.join(', ')}`);
  }
  if (input.bcc.length) {
    headers.push(`Bcc: ${input.bcc.join(', ')}`);
  }
  headers.push(`Subject: ${input.subject}`);
  if (input.inReplyToMessageIdHeader) {
    headers.push(`In-Reply-To: ${input.inReplyToMessageIdHeader}`);
  }
  if (input.references) {
    headers.push(`References: ${input.references}`);
  }
  headers.push('MIME-Version: 1.0');
  headers.push('Content-Type: text/plain; charset="UTF-8"');
  const raw = `${headers.join('\r\n')}\r\n\r\n${input.bodyText}`;
  return encodeBase64Url(raw);
}
