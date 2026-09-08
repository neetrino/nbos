'use client';

import { Building2, FolderKanban, Package } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import {
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_HEAD_CLASS,
  ENTITY_LIST_ROW_HOVER_CLASS,
  ENTITY_LIST_SHELL_CLASS,
  EntityListIconLabel,
  EntityListIconTile,
  EntityListMutedDash,
  EntityListPrimaryCell,
} from '@/components/shared/entity-list-table';
import { getProductDirectoryBadge } from '@/features/projects/utils/products-hub-directory-badge';
import type { Product } from '@/lib/api/products';

interface ProductsHubListTableProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export function ProductsHubListTable({ products, onProductClick }: ProductsHubListTableProps) {
  return (
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Product</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Project</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Company</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Status</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>PM</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const badge = getProductDirectoryBadge(product);
            const pmName = product.pm
              ? `${product.pm.firstName} ${product.pm.lastName}`.trim()
              : null;
            return (
              <TableRow
                key={product.id}
                className={`${ENTITY_LIST_ROW_HOVER_CLASS} cursor-pointer`}
                onClick={() => onProductClick(product)}
              >
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  <span className="flex min-w-0 items-center gap-2">
                    <EntityListIconTile
                      icon={Package}
                      className="bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
                    />
                    <EntityListPrimaryCell title={product.name} />
                  </span>
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  <EntityListIconLabel
                    icon={FolderKanban}
                    iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
                    label={product.project.name}
                  />
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {product.project.company?.name ? (
                    <EntityListIconLabel
                      icon={Building2}
                      iconClassName="bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
                      label={product.project.company.name}
                    />
                  ) : (
                    <EntityListMutedDash />
                  )}
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {badge ? (
                    <StatusBadge label={badge.label} variant={badge.variant} />
                  ) : (
                    <EntityListMutedDash />
                  )}
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {pmName || <EntityListMutedDash />}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
