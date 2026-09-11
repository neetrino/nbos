import type { Prisma } from '@nbos/database';
import { CLIENT_SERVICE_UPCOMING_WINDOW_DAYS } from '../client-service-payment-stage';
import { REGISTRY_SNAPSHOT_TTL_HOURS } from './domain-registry.constants';

const HOUR_MS = 60 * 60 * 1000;
const INACTIVE_EXPENSE_STATUSES = ['PAID', 'CANCELLED'] as const;

export function addUtcDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Domain cards in Upcoming / Invoice / overdue / Pay now, snapshot older than TTL. */
export function buildDomainRegistryEligibleWhere(
  now: Date = new Date(),
): Prisma.ClientServiceRecordWhereInput {
  const upcomingEnd = addUtcDays(now, CLIENT_SERVICE_UPCOMING_WINDOW_DAYS);
  const staleBefore = new Date(now.getTime() - REGISTRY_SNAPSHOT_TTL_HOURS * HOUR_MS);
  return {
    type: 'DOMAIN',
    status: { not: 'CANCELLED' },
    OR: [
      { renewalDate: { not: null, lte: upcomingEnd } },
      { expenses: { some: { status: { notIn: [...INACTIVE_EXPENSE_STATUSES] } } } },
    ],
    AND: [
      {
        OR: [{ registryCheckedAt: null }, { registryCheckedAt: { lt: staleBefore } }],
      },
    ],
  };
}
