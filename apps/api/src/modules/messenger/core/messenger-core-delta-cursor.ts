import { BadRequestException } from '@nestjs/common';
import {
  MESSENGER_CHECKPOINT_PATTERN,
  MESSENGER_DELTA_CURSOR_MAX_LENGTH,
} from './messenger-core-revision.constants';
import type { MessengerDeltaCursor } from './messenger-core-revision.types';

const CURSOR_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseMessengerCheckpoint(raw: string): bigint {
  if (!MESSENGER_CHECKPOINT_PATTERN.test(raw)) {
    throw new BadRequestException('Invalid revision checkpoint');
  }
  return BigInt(raw);
}

export function encodeMessengerDeltaCursor(cursor: MessengerDeltaCursor): string {
  return `${cursor.highWater}|${cursor.revision}|${cursor.conversationId}`;
}

export function parseMessengerDeltaCursor(
  raw: string | undefined,
): MessengerDeltaCursor | undefined {
  if (!raw?.trim()) return undefined;
  if (raw.length > MESSENGER_DELTA_CURSOR_MAX_LENGTH) {
    throw new BadRequestException('Invalid delta cursor');
  }
  const parts = raw.split('|');
  if (parts.length !== 3) throw new BadRequestException('Invalid delta cursor');
  const highWater = parts[0] ?? '';
  const revision = parts[1] ?? '';
  const conversationId = parts[2] ?? '';
  if (!MESSENGER_CHECKPOINT_PATTERN.test(highWater)) {
    throw new BadRequestException('Invalid delta cursor');
  }
  if (!MESSENGER_CHECKPOINT_PATTERN.test(revision)) {
    throw new BadRequestException('Invalid delta cursor');
  }
  if (!CURSOR_UUID.test(conversationId)) {
    throw new BadRequestException('Invalid delta cursor');
  }
  return { highWater, revision, conversationId };
}

export function assertCursorMatchesSnapshot(
  cursor: MessengerDeltaCursor | undefined,
  highWater: string,
): void {
  if (!cursor) return;
  if (cursor.highWater !== highWater) {
    throw new BadRequestException('Invalid delta cursor');
  }
}
