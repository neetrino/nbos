import { BadRequestException } from '@nestjs/common';
import { SUBSCRIPTION_TERM_MONTHS_MAX, SUBSCRIPTION_TERM_MONTHS_MIN } from '@nbos/shared';

/**
 * Validates optional `subscriptionTermMonths` on deal create/update.
 * `undefined` = omit / leave untouched; `null` = open-ended; otherwise integer 1..120.
 */
export function parseOptionalSubscriptionTermMonths(
  value: number | null | undefined,
): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (
    !Number.isInteger(value) ||
    value < SUBSCRIPTION_TERM_MONTHS_MIN ||
    value > SUBSCRIPTION_TERM_MONTHS_MAX
  ) {
    throw new BadRequestException(
      `subscriptionTermMonths must be an integer from ${SUBSCRIPTION_TERM_MONTHS_MIN} to ${SUBSCRIPTION_TERM_MONTHS_MAX}, or null`,
    );
  }
  return value;
}
