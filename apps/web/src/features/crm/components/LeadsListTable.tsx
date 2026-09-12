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
  EntityListDate,
  EntityListMutedDash,
  EntityListPrimaryCell,
  StatusBadge,
} from '@/components/shared';
import { getLeadSource, getLeadStage } from '@/features/crm/constants/leadPipeline';
import {
  translateLeadSourceLabel,
  translateLeadStageLabel,
} from '@/features/crm/i18n/crm-copy';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import type { Lead } from '@/lib/api/leads';
import { cn } from '@/lib/utils';

export interface LeadsListTableProps {
  leads: Lead[];
  boardScope: BoardLifecycleScope;
  onLeadClick: (lead: Lead) => void;
}

export function LeadsListTable({ leads, boardScope, onLeadClick }: LeadsListTableProps) {
  const t = useTranslations('crm');
  return (
    <div className={ENTITY_LIST_SCROLL_SHELL_CLASS}>
      <Table>
        <TableHeader className="bg-card sticky top-0 z-10">
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('leads.table.name')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('leads.table.contact')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('leads.table.phone')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('leads.table.email')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('leads.table.source')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('leads.table.stage')}</TableHead>
            {boardScope === 'CLOSED' ? (
              <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('leads.table.closed')}</TableHead>
            ) : null}
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('leads.table.seller')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('leads.table.created')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <LeadListRow
              key={lead.id}
              lead={lead}
              boardScope={boardScope}
              onLeadClick={onLeadClick}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LeadListRow({
  lead,
  boardScope,
  onLeadClick,
}: {
  lead: Lead;
  boardScope: BoardLifecycleScope;
  onLeadClick: (lead: Lead) => void;
}) {
  const t = useTranslations('crm');
  const stage = getLeadStage(lead.status);
  const source = getLeadSource(lead.source);
  const sellerLabel = lead.assignee ? `${lead.assignee.firstName} ${lead.assignee.lastName}` : null;
  const sourceLabel = source ? translateLeadSourceLabel(t, source.value) : t('common.noSource');
  const stageLabel = stage ? translateLeadStageLabel(t, stage.key) : null;

  return (
    <TableRow
      className={cn(ENTITY_LIST_ROW_HOVER_CLASS, 'cursor-pointer')}
      onClick={() => onLeadClick(lead)}
    >
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <EntityListPrimaryCell title={lead.name || lead.code} subtitle={lead.code} />
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {lead.contactName ? (
          <span className="text-sm">{lead.contactName}</span>
        ) : (
          <EntityListMutedDash />
        )}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {lead.phone ? <span className="text-sm">{lead.phone}</span> : <EntityListMutedDash />}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {lead.email ? <span className="text-sm">{lead.email}</span> : <EntityListMutedDash />}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <StatusBadge
          label={sourceLabel}
          variant="default"
          className={ENTITY_LIST_BADGE_CLASS}
        />
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {stage ? (
          <StatusBadge
            label={stageLabel ?? stage.label}
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
          <EntityListDate value={lead.updatedAt} />
        </TableCell>
      ) : null}
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {sellerLabel ? <span className="text-sm">{sellerLabel}</span> : <EntityListMutedDash />}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <EntityListDate value={lead.createdAt} />
      </TableCell>
    </TableRow>
  );
}
