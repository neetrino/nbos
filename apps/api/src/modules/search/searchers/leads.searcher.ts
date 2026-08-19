import type { PrismaClient } from '@nbos/database';
import { mergeProfileAListScope } from '../../../common/lifecycle/entity-lifecycle-scope';
import { buildLeadSearchOr } from '../../crm/leads/lead-search.where';
import { buildLeadSearchHref } from '../search-href';
import type { SearchHit } from '../search.types';

function leadTitle(row: { name: string | null; contactName: string; code: string }): string {
  return row.name?.trim() || row.contactName?.trim() || row.code;
}

export async function searchLeads(
  prisma: InstanceType<typeof PrismaClient>,
  query: string,
  limit: number,
): Promise<SearchHit[]> {
  const where = mergeProfileAListScope(
    {
      mergedIntoId: null,
      OR: buildLeadSearchOr(query),
    },
    'active',
  );

  const rows = await prisma.lead.findMany({
    where,
    select: {
      id: true,
      code: true,
      name: true,
      contactName: true,
      updatedAt: true,
      createdAt: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    group: 'leads',
    entityType: 'lead',
    title: leadTitle(row),
    subtitle: 'Lead',
    href: buildLeadSearchHref(row.id),
    occurredAt: (row.updatedAt ?? row.createdAt).toISOString(),
  }));
}
