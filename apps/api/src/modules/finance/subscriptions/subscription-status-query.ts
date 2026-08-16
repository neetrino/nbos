import type { SubscriptionStatusEnum } from '@nbos/database';
import { assertSubscriptionStatus } from './subscription-coverage';

export type SubscriptionStatusQueryFilter =
  | SubscriptionStatusEnum
  | { in: SubscriptionStatusEnum[] };

/**
 * Parses `status` query: omitted → all; one token → equals; comma list → `{ in }`.
 * Trims tokens; empty or invalid tokens are 400 via `assertSubscriptionStatus`.
 */
export function parseSubscriptionStatusQuery(
  raw: string | undefined,
): SubscriptionStatusQueryFilter | undefined {
  if (raw == null || raw.trim() === '') {
    return undefined;
  }

  const statuses: SubscriptionStatusEnum[] = [];
  for (const token of raw.split(',')) {
    const status = token.trim();
    assertSubscriptionStatus(status);
    statuses.push(status);
  }

  const [only] = statuses;
  if (only && statuses.length === 1) {
    return only;
  }
  return { in: statuses };
}
