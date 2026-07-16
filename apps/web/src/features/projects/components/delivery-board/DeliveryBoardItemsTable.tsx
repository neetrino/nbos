'use client';

import { FolderKanban } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  ENTITY_LIST_BADGE_CLASS,
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_HEAD_CLASS,
  ENTITY_LIST_ROW_HOVER_CLASS,
  ENTITY_LIST_SCROLL_SHELL_CLASS,
  ENTITY_LIST_TYPE_CLASS,
  EntityListDate,
  EntityListIconLabel,
  EntityListMutedDash,
  EntityListPrimaryCell,
  StatusBadge,
} from '@/components/shared';
import {
  formatDeliveryLifecycleLabel,
  getDeliveryLifecycleVariant,
} from '@/features/projects/constants/projects';
import { cn } from '@/lib/utils';
import { getClosedDeadlineOutcomeLabel } from './delivery-board-closed-filters';
import {
  DELIVERY_STAGE_LABELS,
  getItemKey,
  getItemLabel,
  getItemLifecycle,
  type DeliveryBoardItem,
} from './project-delivery-board-model';

const PROJECT_ICON_CLASS =
  'bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400';

function getOwnerLabel(item: DeliveryBoardItem): string | null {
  if (item.kind === 'PRODUCT') {
    const pm = item.product.pm;
    return pm ? `${pm.firstName} ${pm.lastName}` : null;
  }
  const assignee = item.extension.assignee;
  return assignee ? `${assignee.firstName} ${assignee.lastName}` : null;
}

function getProjectLabel(item: DeliveryBoardItem): string | null {
  const project = item.kind === 'PRODUCT' ? item.product.project : item.extension.project;
  return project ? `${project.name} (${project.code})` : null;
}

function getClosedAt(item: DeliveryBoardItem): string | null {
  const iso = item.kind === 'PRODUCT' ? item.product.updatedAt : item.extension.updatedAt;
  return iso ?? null;
}

function getActiveStageLabel(item: DeliveryBoardItem): string | null {
  const stage = getItemLifecycle(item)?.stage;
  return stage ? DELIVERY_STAGE_LABELS[stage] : null;
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
    <div className={ENTITY_LIST_SCROLL_SHELL_CLASS}>
      <Table>
        <TableHeader className="bg-card sticky top-0 z-10">
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Entity</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Name</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Project</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>PM / owner</TableHead>
            {isClosed ? (
              <>
                <TableHead className={ENTITY_LIST_HEAD_CLASS}>Result</TableHead>
                <TableHead className={ENTITY_LIST_HEAD_CLASS}>Closed</TableHead>
                <TableHead className={ENTITY_LIST_HEAD_CLASS}>Deadline</TableHead>
              </>
            ) : (
              <>
                <TableHead className={ENTITY_LIST_HEAD_CLASS}>Stage</TableHead>
                <TableHead className={ENTITY_LIST_HEAD_CLASS}>Status</TableHead>
              </>
            )}
            <TableHead className={cn(ENTITY_LIST_HEAD_CLASS, 'w-[100px]')} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={isClosed ? 8 : 7}
                className={cn(ENTITY_LIST_CELL_CLASS, 'text-muted-foreground py-8 text-center')}
              >
                {isClosed ? 'No closed delivery items match.' : 'No active delivery items match.'}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <DeliveryBoardItemRow
                key={getItemKey(item)}
                item={item}
                isClosed={isClosed}
                onOpenDetails={onOpenDetails}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function DeliveryBoardItemRow({
  item,
  isClosed,
  onOpenDetails,
}: {
  item: DeliveryBoardItem;
  isClosed: boolean;
  onOpenDetails: (item: DeliveryBoardItem) => void;
}) {
  const lc = getItemLifecycle(item);
  const projectLabel = getProjectLabel(item);
  const ownerLabel = getOwnerLabel(item);
  const stageLabel = getActiveStageLabel(item);
  const deadlineLabel = getClosedDeadlineOutcomeLabel(item);

  return (
    <TableRow className={ENTITY_LIST_ROW_HOVER_CLASS}>
      <TableCell className={cn(ENTITY_LIST_CELL_CLASS, ENTITY_LIST_TYPE_CLASS)}>
        {item.kind === 'PRODUCT' ? 'Product' : 'Extension'}
      </TableCell>
      <TableCell className={cn(ENTITY_LIST_CELL_CLASS, 'max-w-[200px]')}>
        <EntityListPrimaryCell title={getItemLabel(item)} />
      </TableCell>
      <TableCell className={cn(ENTITY_LIST_CELL_CLASS, 'max-w-[160px]')}>
        {projectLabel ? (
          <EntityListIconLabel
            icon={FolderKanban}
            iconClassName={PROJECT_ICON_CLASS}
            label={projectLabel}
          />
        ) : (
          <EntityListMutedDash />
        )}
      </TableCell>
      <TableCell className={cn(ENTITY_LIST_CELL_CLASS, 'max-w-[120px]')}>
        {ownerLabel ? (
          <span className="truncate text-sm">{ownerLabel}</span>
        ) : (
          <EntityListMutedDash />
        )}
      </TableCell>
      {isClosed ? (
        <>
          <TableCell className={ENTITY_LIST_CELL_CLASS}>
            {lc ? (
              <StatusBadge
                label={formatDeliveryLifecycleLabel(lc)}
                variant={getDeliveryLifecycleVariant(lc)}
                className={ENTITY_LIST_BADGE_CLASS}
              />
            ) : (
              <EntityListMutedDash />
            )}
          </TableCell>
          <TableCell className={ENTITY_LIST_CELL_CLASS}>
            <EntityListDate value={getClosedAt(item)} />
          </TableCell>
          <TableCell className={ENTITY_LIST_CELL_CLASS}>
            {deadlineLabel && deadlineLabel !== '—' ? (
              <span className="text-sm">{deadlineLabel}</span>
            ) : (
              <EntityListMutedDash />
            )}
          </TableCell>
        </>
      ) : (
        <>
          <TableCell className={ENTITY_LIST_CELL_CLASS}>
            {stageLabel ? <span className="text-sm">{stageLabel}</span> : <EntityListMutedDash />}
          </TableCell>
          <TableCell className={ENTITY_LIST_CELL_CLASS}>
            {lc ? (
              <StatusBadge
                label={formatDeliveryLifecycleLabel(lc)}
                variant={getDeliveryLifecycleVariant(lc)}
                className={ENTITY_LIST_BADGE_CLASS}
              />
            ) : (
              <EntityListMutedDash />
            )}
          </TableCell>
        </>
      )}
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
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
}
