import { BadRequestException } from '@nestjs/common';
import type { SubscriptionStatusEnum } from '@nbos/database';

/** Allowed manual transitions (billing scheduler never calls these helpers). */
const ALLOWED_TRANSITIONS: Record<SubscriptionStatusEnum, readonly SubscriptionStatusEnum[]> = {
  PENDING: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['ON_HOLD', 'CANCELLED', 'COMPLETED'],
  ON_HOLD: ['ACTIVE', 'CANCELLED', 'COMPLETED'],
  CANCELLED: ['ACTIVE'],
  COMPLETED: [],
};

/**
 * Validates a subscription status change before persistence.
 * Rejects no-op updates and disallowed moves (e.g. re-activating a completed row).
 */
export function assertSubscriptionStatusTransition(
  from: SubscriptionStatusEnum,
  to: SubscriptionStatusEnum,
): void {
  if (from === to) {
    throw new BadRequestException(`Subscription status is already ${from}`);
  }

  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new BadRequestException(`Cannot change subscription status from ${from} to ${to}`);
  }
}
