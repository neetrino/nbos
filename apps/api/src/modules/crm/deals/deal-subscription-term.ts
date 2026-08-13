import { BadRequestException } from '@nestjs/common';

/** Minimum covered months for a fixed-term deal subscription. */
export const DEAL_SUBSCRIPTION_TERM_MONTHS_MIN = 1;
/** Maximum covered months for a fixed-term deal subscription. */
export const DEAL_SUBSCRIPTION_TERM_MONTHS_MAX = 120;

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
    value < DEAL_SUBSCRIPTION_TERM_MONTHS_MIN ||
    value > DEAL_SUBSCRIPTION_TERM_MONTHS_MAX
  ) {
    throw new BadRequestException(
      `subscriptionTermMonths must be an integer from ${DEAL_SUBSCRIPTION_TERM_MONTHS_MIN} to ${DEAL_SUBSCRIPTION_TERM_MONTHS_MAX}, or null`,
    );
  }
  return value;
}
