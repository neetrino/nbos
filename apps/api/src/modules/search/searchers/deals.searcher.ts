import type { PrismaClient } from '@nbos/database';
import { mergeProfileAListScope } from '../../../common/lifecycle/entity-lifecycle-scope';
import { buildDealSearchOr } from '../../crm/deals/deal-search.where';
import { buildDealSearchHref } from '../search-href';
import type { SearchHit } from '../search.types';

function dealTitle(row: { name: string | null; code: string }): string {
  return row.name?.trim() || row.code;
}

export async function searchDeals(
  prisma: InstanceType<typeof PrismaClient>,
  query: string,
  limit: number,
): Promise<SearchHit[]> {
  const where = mergeProfileAListScope({ OR: buildDealSearchOr(query) }, 'active');

  const rows = await prisma.deal.findMany({
    where,
    select: {
      id: true,
      code: true,
      name: true,
      updatedAt: true,
      createdAt: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    group: 'deals',
    entityType: 'deal',
    title: dealTitle(row),
    subtitle: row.code ? `Deal · ${row.code}` : 'Deal',
    href: buildDealSearchHref(row.id),
    occurredAt: (row.updatedAt ?? row.createdAt).toISOString(),
  }));
}
