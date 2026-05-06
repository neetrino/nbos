import { BadRequestException } from '@nestjs/common';
import type { SupportTicketCloseReasonEnum } from '@nbos/database';

const CLOSE_REASONS: SupportTicketCloseReasonEnum[] = [
  'CLIENT_CONFIRMED',
  'AUTO_TIMED_OUT',
  'EXTENSION_DELIVERED',
  'MANUAL',
  'DUPLICATE',
];

export function parseSupportTicketCloseReason(
  value: string | undefined,
): SupportTicketCloseReasonEnum | undefined {
  if (value === undefined || value === '') return undefined;
  if (!CLOSE_REASONS.includes(value as SupportTicketCloseReasonEnum)) {
    throw new BadRequestException('Invalid closeReason.');
  }
  return value as SupportTicketCloseReasonEnum;
}
