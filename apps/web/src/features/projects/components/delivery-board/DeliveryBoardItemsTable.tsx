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
import { DELIVERY_BOARD_CARD_DATE_LABEL_CLASS } from './delivery-board-card-ui.constants';
import { formatDeliveryBoardCardDate } from './format-delivery-board-card-date';
import {
  DELIVERY_STAGE_LABELS,
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
  const assignee = item.extension.assignee;
  return assignee ? `${assignee.firstName} ${assignee.lastName}` : '—';
}

function getProjectLabel(item: DeliveryBoardItem): string {
  const project = item.kind === 'PRODUCT' ? item.product.project : item.extension.project;
  return project ? `${project.name} (${project.code})` : '—';
}

function getClosedDisplay(item: DeliveryBoardItem): string {
  const iso = item.kind === 'PRODUCT' ? item.product.updatedAt : item.extension.updatedAt;
  return iso ? formatDeliveryBoardCardDate(iso) : '—';
}

function getActiveStageLabel(item: DeliveryBoardItem): string {
  const stage = getItemLifecycle(item)?.stage;
  return stage ? DELIVERY_STAGE_LABELS[stage] : '—';
}

export interface DeliveryBoardItemsTableProps {
  mode: 'active' | 'closed';
  items: DeliveryBoardItem[];
  onOpenDetails: (item: DeliveryBoardItem) => void;
}

export function DeliveryBoardItemsTable({
  mode,
  items,
  onOpenDetails,
}: DeliveryBoardItemsTableProps) {
  const isClosed = mode === 'closed';

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Entity</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>PM / owner</TableHead>
            {isClosed ? (
              <>
                <TableHead>Result</TableHead>
                <TableHead>Closed</TableHead>
                <TableHead>Deadline</TableHead>
              </>
            ) : (
              <>
                <TableHead>Stage</TableHead>
                <TableHead>Status</TableHead>
              </>
            )}
            <TableHead className="w-[100px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={isClosed ? 8 : 7}
                className="text-muted-foreground py-8 text-center text-sm"
              >
                {isClosed ? 'No closed delivery items match.' : 'No active delivery items match.'}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const lc = getItemLifecycle(item);
              return (
                <TableRow key={getItemKey(item)}>
                  <TableCell className="text-xs font-medium">
                    {item.kind === 'PRODUCT' ? 'Product' : 'Extension'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm font-medium">
                    {getItemLabel(item)}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[160px] truncate text-xs">
                    {getProjectLabel(item)}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[120px] truncate text-xs">
                    {getOwnerLabel(item)}
                  </TableCell>
                  {isClosed ? (
                    <>
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
                      <TableCell className={DELIVERY_BOARD_CARD_DATE_LABEL_CLASS}>
                        {getClosedDisplay(item)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {getClosedDeadlineOutcomeLabel(item)}
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-muted-foreground text-xs">
                        {getActiveStageLabel(item)}
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
                    </>
                  )}
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
