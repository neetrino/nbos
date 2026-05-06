import { BadRequestException } from '@nestjs/common';
import {
  MESSENGER_MESSAGES_DEFAULT_PAGE_SIZE,
  MESSENGER_MESSAGES_MAX_PAGE_SIZE,
} from './messenger-messages.constants';

export function clampMessengerPageSizeValue(n: number | undefined): number {
  if (n == null || !Number.isFinite(n) || n < 1) {
    return MESSENGER_MESSAGES_DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(n), MESSENGER_MESSAGES_MAX_PAGE_SIZE);
}

export function clampMessengerListPageSize(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') {
    return MESSENGER_MESSAGES_DEFAULT_PAGE_SIZE;
  }
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new BadRequestException('Invalid pageSize');
  }
  return Math.min(parsed, MESSENGER_MESSAGES_MAX_PAGE_SIZE);
}

export function parseMessengerBeforeCursor(raw: string | undefined): Date | undefined {
  if (raw === undefined || raw.trim() === '') return undefined;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException('Invalid before cursor (expected ISO-8601 date-time)');
  }
  return d;
}
