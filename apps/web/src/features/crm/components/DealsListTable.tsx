'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ENTITY_LIST_BADGE_CLASS,
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_HEAD_CLASS,
  ENTITY_LIST_ROW_HOVER_CLASS,
  ENTITY_LIST_SHELL_CLASS,
  ENTITY_LIST_TYPE_CLASS,
  EntityListAmount,
  EntityListDate,
  EntityListMutedDash,
  EntityListPrimaryCell,
  StatusBadge,
} from '@/components/shared';
import { getDealStage } from '@/features/crm/constants/dealPipeline';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import { getDealTypePresentation } from '@/lib/deal-type-visual';
import type { Deal } from '@/lib/api/deals';
import { cn } from '@/lib/utils';

export interface DealsListTableProps {
  deals: Deal[];
  boardScope: BoardLifecycleScope;
  onDealClick: (deal: Deal) => void;
}

export function DealsListTable({ deals, boardScope, onDealClick }: DealsListTableProps) {
  return (
    <div className={cn(ENTITY_LIST_SHELL_CLASS, 'min-h-0 flex-1 overflow-auto')}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Name</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Contact</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Amount</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Type</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Stage</TableHead>
            {boardScope === 'CLOSED' ? (
              <TableHead className={ENTITY_LIST_HEAD_CLASS}>Closed</TableHead>
            ) : null}
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Seller</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <DealListRow
              key={deal.id}
              deal={deal}
              boardScope={boardScope}
              onDealClick={onDealClick}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DealListRow({
  deal,
  boardScope,
  onDealClick,
}: {
  deal: Deal;
  boardScope: BoardLifecycleScope;
  onDealClick: (deal: Deal) => void;
}) {
  const stage = getDealStage(deal.status);
  const dealTypeVisual = getDealTypePresentation(deal.type);
  const contactLabel = deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : null;
  const sellerLabel = deal.seller ? `${deal.seller.firstName} ${deal.seller.lastName}` : null;
  const amount = deal.amount;

  return (
    <TableRow
      className={cn(ENTITY_LIST_ROW_HOVER_CLASS, 'cursor-pointer')}
      onClick={() => onDealClick(deal)}
    >
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <EntityListPrimaryCell title={deal.name || deal.code} subtitle={deal.code} />
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {contactLabel ? <span className="text-sm">{contactLabel}</span> : <EntityListMutedDash />}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {amount != null && amount !== 0 ? (
          <EntityListAmount amount={amount} />
        ) : (
          <EntityListMutedDash />
        )}
      </TableCell>
      <TableCell className={cn(ENTITY_LIST_CELL_CLASS, ENTITY_LIST_TYPE_CLASS)}>
        {dealTypeVisual.label}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {stage ? (
          <StatusBadge
            label={stage.label}
            variant={stage.variant}
            className={ENTITY_LIST_BADGE_CLASS}
            dot
            dotColor={stage.color}
          />
        ) : (
          <EntityListMutedDash />
        )}
      </TableCell>
      {boardScope === 'CLOSED' ? (
        <TableCell className={ENTITY_LIST_CELL_CLASS}>
          <EntityListDate value={deal.updatedAt} />
        </TableCell>
      ) : null}
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {sellerLabel ? <span className="text-sm">{sellerLabel}</span> : <EntityListMutedDash />}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <EntityListDate value={deal.createdAt} />
      </TableCell>
    </TableRow>
  );
}
