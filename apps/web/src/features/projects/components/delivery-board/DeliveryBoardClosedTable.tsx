'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import {
  formatDeliveryLifecycleLabel,
  getDeliveryLifecycleVariant,
} from '@/features/projects/constants/projects';
import { getClosedDeadlineOutcomeLabel } from './delivery-board-closed-filters';
import {
  getItemKey,
  getItemLabel,
  getItemLifecycle,
  type DeliveryBoardItem,
} from './project-delivery-board-model';

function getOwnerLabel(item: DeliveryBoardItem): string {
  if (item.kind === 'PRODUCT') {
    const pm = item.product.pm;
    return pm ? `${pm.firstName} ${pm.lastName}` : '—';
  }
  const a = item.extension.assignee;
  return a ? `${a.firstName} ${a.lastName}` : '—';
}

function getClosedDisplay(item: DeliveryBoardItem): string {
  const iso = item.kind === 'PRODUCT' ? item.product.updatedAt : item.extension.updatedAt;
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

interface DeliveryBoardClosedTableProps {
  items: DeliveryBoardItem[];
  onOpenDetails: (item: DeliveryBoardItem) => void;
}

export function DeliveryBoardClosedTable({ items, onOpenDetails }: DeliveryBoardClosedTableProps) {
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Entity</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>PM / owner</TableHead>
            <TableHead>Result</TableHead>
            <TableHead>Closed</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead className="w-[100px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-muted-foreground py-8 text-center text-sm">
                No closed delivery items match.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const lc = getItemLifecycle(item);
              const projectLabel =
                item.kind === 'PRODUCT'
                  ? item.product.project
                    ? `${item.product.project.name} (${item.product.project.code})`
                    : '—'
                  : item.extension.project
                    ? `${item.extension.project.name} (${item.extension.project.code})`
                    : '—';
              return (
                <TableRow key={getItemKey(item)}>
                  <TableCell className="text-xs font-medium">
                    {item.kind === 'PRODUCT' ? 'Product' : 'Extension'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm font-medium">
                    {getItemLabel(item)}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[160px] truncate text-xs">
                    {projectLabel}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[120px] truncate text-xs">
                    {getOwnerLabel(item)}
                  </TableCell>
                  <TableCell>
                    {lc ? (
                      <StatusBadge
                        label={formatDeliveryLifecycleLabel(lc)}
                        variant={getDeliveryLifecycleVariant(lc)}
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {getClosedDisplay(item)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {getClosedDeadlineOutcomeLabel(item)}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onOpenDetails(item)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
