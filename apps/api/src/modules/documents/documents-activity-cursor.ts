import { BadRequestException } from '@nestjs/common';

type CursorPayload = { c: string; i: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function encodeDocumentActivityCursor(createdAt: Date, id: string): string {
  const payload: CursorPayload = { c: createdAt.toISOString(), i: id };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeDocumentActivityCursor(raw: string): { createdAt: Date; id: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new BadRequestException('Invalid activity cursor.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(trimmed, 'base64url').toString('utf8')) as unknown;
  } catch {
    throw new BadRequestException('Invalid activity cursor.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new BadRequestException('Invalid activity cursor.');
  }
  const o = parsed as Record<string, unknown>;
  const c = o.c;
  const i = o.i;
  if (typeof c !== 'string' || typeof i !== 'string') {
    throw new BadRequestException('Invalid activity cursor.');
  }
  const createdAt = new Date(c);
  if (Number.isNaN(createdAt.getTime())) {
    throw new BadRequestException('Invalid activity cursor.');
  }
  if (!UUID_RE.test(i)) {
    throw new BadRequestException('Invalid activity cursor.');
  }
  return { createdAt, id: i };
}
