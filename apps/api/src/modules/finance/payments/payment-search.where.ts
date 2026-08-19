import type { Prisma } from '@nbos/database';

/** Payment text search clause shared by payment list and global search. */
export function buildPaymentSearchWhere(searchTrimmed: string): Prisma.PaymentWhereInput {
  const ic = { contains: searchTrimmed, mode: 'insensitive' as const };
  return {
    OR: [
      { notes: ic },
      {
        invoice: {
          OR: [
            { code: ic },
            { company: { name: ic } },
            {
              order: {
                OR: [{ code: ic }, { project: { name: ic } }, { project: { code: ic } }],
              },
            },
            {
              subscription: {
                OR: [
                  { code: ic },
                  { name: ic },
                  { project: { name: ic } },
                  { project: { code: ic } },
                ],
              },
            },
          ],
        },
      },
    ],
  };
}
