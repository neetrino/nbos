'use client';

import { useTranslations } from 'next-intl';
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
  ENTITY_LIST_SCROLL_SHELL_CLASS,
  ENTITY_LIST_TYPE_CLASS,
  EntityListAmount,
  EntityListDate,
  EntityListMutedDash,
  EntityListPrimaryCell,
  StatusBadge,
} from '@/components/shared';
import { getDealStage } from '@/features/crm/constants/dealPipeline';
import { translateDealStageLabel, translateDealTypeLabel } from '@/features/crm/i18n/crm-copy';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import type { Deal } from '@/lib/api/deals';
import { cn } from '@/lib/utils';

export interface DealsListTableProps {
  deals: Deal[];
  boardScope: BoardLifecycleScope;
  onDealClick: (deal: Deal) => void;
}

export function DealsListTable({ deals, boardScope, onDealClick }: DealsListTableProps) {
  const t = useTranslations('crm');
  return (
    <div className={ENTITY_LIST_SCROLL_SHELL_CLASS}>
      <Table>
        <TableHeader className="bg-card sticky top-0 z-10">
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('deals.table.name')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('deals.table.contact')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('deals.table.amount')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('deals.table.type')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('deals.table.stage')}</TableHead>
            {boardScope === 'CLOSED' ? (
              <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('deals.table.closed')}</TableHead>
            ) : null}
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('deals.table.seller')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('deals.table.created')}</TableHead>
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
  const t = useTranslations('crm');
  const stage = getDealStage(deal.status);
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
        {translateDealTypeLabel(t, deal.type)}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {stage ? (
          <StatusBadge
            label={translateDealStageLabel(t, deal.status)}
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
