import type { Prisma } from '@nbos/database';

/** Subscription text search OR clause shared by subscription list and global search. */
export function buildSubscriptionSearchOr(q: string): Prisma.SubscriptionWhereInput[] {
  const ic = { contains: q, mode: 'insensitive' as const };
  return [
    { code: ic },
    { name: ic },
    { project: { name: ic } },
    { project: { code: ic } },
    { project: { company: { name: ic } } },
    { partner: { name: ic } },
  ];
}
