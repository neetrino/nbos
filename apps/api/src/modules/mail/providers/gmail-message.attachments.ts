import type { gmail_v1 } from 'googleapis';
import type { NormalizedAttachment } from './mail-provider-adapter';

type Payload = gmail_v1.Schema$MessagePart;

function partHeader(part: Payload, name: string): string | null {
  const found = (part.headers ?? []).find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return found?.value ?? null;
}

function isGmailInlinePart(part: Payload): boolean {
  const disposition = partHeader(part, 'Content-Disposition') ?? '';
  if (disposition.toLowerCase().startsWith('inline')) {
    return true;
  }
  return Boolean(partHeader(part, 'Content-ID'));
}

function isBodyPartWithoutFilename(part: Payload): boolean {
  const filename = part.filename?.trim() ?? '';
  if (filename) {
    return false;
  }
  const mime = (part.mimeType ?? '').toLowerCase();
  return mime === 'text/plain' || mime === 'text/html';
}

function collectFromPart(part: Payload | undefined, into: NormalizedAttachment[]): void {
  if (!part) {
    return;
  }
  const filename = part.filename?.trim() ?? '';
  const attachmentId = part.body?.attachmentId;
  if (filename && attachmentId && !isBodyPartWithoutFilename(part)) {
    into.push({
      providerAttachmentId: attachmentId,
      fileName: filename,
      mimeType: part.mimeType ?? null,
      sizeBytes: part.body?.size ?? null,
      isInline: isGmailInlinePart(part),
    });
  }
  for (const child of part.parts ?? []) {
    collectFromPart(child, into);
  }
}

/** Metadata only — never reads `body.data` bytes. */
export function collectGmailAttachments(payload: Payload | undefined): NormalizedAttachment[] {
  const attachments: NormalizedAttachment[] = [];
  collectFromPart(payload, attachments);
  return attachments;
}
