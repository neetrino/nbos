import type { Prisma } from '@nbos/database';

/** Order text search OR clause shared by order list and global search. */
export function buildOrderSearchOr(searchTrimmed: string): Prisma.OrderWhereInput[] {
  const ic = { contains: searchTrimmed, mode: 'insensitive' as const };
  return [
    { code: ic },
    { project: { name: ic } },
    { project: { code: ic } },
    { project: { company: { name: ic } } },
    { deal: { code: ic } },
    { deal: { name: ic } },
    { product: { name: ic } },
    { extension: { name: ic } },
    { partner: { name: ic } },
  ];
}
