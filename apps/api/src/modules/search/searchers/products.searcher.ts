import type { PrismaClient } from '@nbos/database';
import { mergeActiveParentProjectScope } from '../../projects/active-project-list-scope';
import { buildProductSearchOr } from '../../projects/products/product-search.where';
import { buildProductSearchHref } from '../search-href';
import type { SearchHit } from '../search.types';

export async function searchProducts(
  prisma: InstanceType<typeof PrismaClient>,
  query: string,
  limit: number,
): Promise<SearchHit[]> {
  const baseWhere = mergeActiveParentProjectScope({ OR: buildProductSearchOr(query) }, {});

  const rows = await prisma.product.findMany({
    where: baseWhere,
    select: {
      id: true,
      name: true,
      updatedAt: true,
      createdAt: true,
      project: { select: { id: true, name: true, code: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  return rows
    .filter((row) => row.project?.id)
    .map((row) => {
      const project = row.project!;
      const projectLabel = project.name?.trim() || project.code;
      return {
        id: row.id,
        group: 'products',
        entityType: 'product',
        title: row.name,
        subtitle: projectLabel ? `Product · ${projectLabel}` : 'Product',
        href: buildProductSearchHref(project.id, row.id),
        occurredAt: (row.updatedAt ?? row.createdAt).toISOString(),
      };
    });
}
