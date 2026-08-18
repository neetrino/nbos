import { randomBytes } from 'node:crypto';
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

function encodeBase64Url(value: string | Buffer): string {
  const buffer = typeof value === 'string' ? Buffer.from(value, 'utf8') : value;
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function wrapBase64(value: Buffer): string {
  return value.toString('base64').replace(/(.{76})/g, '$1\r\n');
}

function quoteFileName(fileName: string): string {
  return fileName.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
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
  const attachments = input.attachments ?? [];
  if (attachments.length > 0) {
    const mixed = `nbos_mix_${randomBytes(12).toString('hex')}`;
    headers.push(`Content-Type: multipart/mixed; boundary="${mixed}"`);
    const parts = [
      buildBodyPart(input, mixed),
      ...attachments.map((item) => buildAttachmentPart(mixed, item)),
    ];
    return encodeBase64Url(`${headers.join('\r\n')}\r\n\r\n${parts.join('\r\n')}--${mixed}--\r\n`);
  }
  const html = input.bodyHtml?.trim();
  if (html) {
    const boundary = `nbos_${randomBytes(16).toString('hex')}`;
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    return encodeBase64Url(
      `${headers.join('\r\n')}\r\n\r\n${buildAlternativeBody(input, boundary)}`,
    );
  }
  headers.push('Content-Type: text/plain; charset="UTF-8"');
  return encodeBase64Url(`${headers.join('\r\n')}\r\n\r\n${input.bodyText}`);
}

function buildAlternativeBody(
  input: Pick<SendMessageInput, 'bodyText' | 'bodyHtml'>,
  boundary: string,
): string {
  const html = input.bodyHtml?.trim() ?? '';
  return [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    input.bodyText,
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

function buildBodyPart(input: SendMessageInput, mixedBoundary: string): string {
  const html = input.bodyHtml?.trim();
  if (!html) {
    return [
      `--${mixedBoundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      input.bodyText,
      '',
    ].join('\r\n');
  }
  const inner = `nbos_alt_${randomBytes(12).toString('hex')}`;
  return [
    `--${mixedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${inner}"`,
    '',
    buildAlternativeBody(input, inner),
  ].join('\r\n');
}

function buildAttachmentPart(
  mixedBoundary: string,
  item: NonNullable<SendMessageInput['attachments']>[number],
): string {
  const safeName = quoteFileName(item.filename);
  const disposition = item.isInline ? 'inline' : 'attachment';
  const lines = [
    `--${mixedBoundary}`,
    `Content-Type: ${item.contentType}; name="${safeName}"`,
    `Content-Disposition: ${disposition}; filename="${safeName}"`,
    'Content-Transfer-Encoding: base64',
  ];
  if (item.contentId) {
    lines.push(`Content-ID: <${item.contentId}>`);
  }
  lines.push('', wrapBase64(item.content), '');
  return lines.join('\r\n');
}
