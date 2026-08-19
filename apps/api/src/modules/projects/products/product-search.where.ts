import type { Prisma } from '@nbos/database';

/** Text search OR clause shared by product list and global search. */
export function buildProductSearchOr(q: string): Prisma.ProductWhereInput[] {
  const ic = { contains: q, mode: 'insensitive' as const };
  return [
    { name: ic },
    { project: { name: ic } },
    { project: { code: ic } },
    { order: { code: ic } },
  ];
}
