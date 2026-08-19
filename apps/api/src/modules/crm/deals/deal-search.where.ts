import type { Prisma } from '@nbos/database';

/** Text search OR clause shared by deal list and global search. */
export function buildDealSearchOr(q: string): Prisma.DealWhereInput[] {
  const ic = { contains: q, mode: 'insensitive' as const };
  return [
    { code: ic },
    { name: ic },
    { contact: { firstName: ic } },
    { contact: { lastName: ic } },
    { contact: { email: ic } },
    { company: { name: ic } },
    { lead: { code: ic } },
    { lead: { contactName: ic } },
    { existingProduct: { name: ic } },
    { sourcePartner: { name: ic } },
    { sourceContact: { firstName: ic } },
    { sourceContact: { lastName: ic } },
    { marketingAccount: { name: ic } },
    { marketingActivity: { title: ic } },
    { orders: { some: { code: ic } } },
  ];
}
