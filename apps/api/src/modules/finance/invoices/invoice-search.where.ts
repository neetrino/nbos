import type { Prisma } from '@nbos/database';

/** Invoice text search OR (without project-id prelookup). */
export function buildInvoiceSearchOr(
  searchTrimmed: string,
  matchedProjectIds: string[],
): Prisma.InvoiceWhereInput {
  const ic = { contains: searchTrimmed, mode: 'insensitive' as const };
  return {
    OR: [
      { code: ic },
      { govInvoiceId: ic },
      { company: { name: ic } },
      {
        order: {
          OR: [
            { code: ic },
            { deal: { name: ic } },
            { deal: { code: ic } },
            { project: { name: ic } },
            { project: { code: ic } },
            { product: { name: ic } },
            { extension: { name: ic } },
          ],
        },
      },
      {
        subscription: {
          OR: [{ code: ic }, { name: ic }, { project: { name: ic } }, { project: { code: ic } }],
        },
      },
      ...(matchedProjectIds.length > 0 ? [{ projectId: { in: matchedProjectIds } }] : []),
    ],
  };
}
