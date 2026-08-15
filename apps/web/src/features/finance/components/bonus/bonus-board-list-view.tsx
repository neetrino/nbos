'use client';

import { Gift, FolderKanban } from 'lucide-react';
import { type KeyboardEvent } from 'react';
import { EmptyState, StatusBadge } from '@/components/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BONUS_BOARD_TYPE_CONFIG } from '@/features/finance/constants/bonus-board';
import {
  BONUS_ENTRY_STATUS_LABEL,
  BONUS_ENTRY_STATUS_VARIANT,
} from '@/features/finance/constants/bonus-board-status-ui';
import {
  employeeDisplayName,
  parseBonusAmount,
} from '@/features/finance/components/bonus/bonus-board-widgets';
import {
  ENTITY_LIST_BADGE_CLASS,
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_HEAD_CLASS,
  ENTITY_LIST_ROW_HOVER_CLASS,
  ENTITY_LIST_SCROLL_SHELL_CLASS,
  EntityListAmount,
  EntityListIconLabel,
  EntityListMutedDash,
  EntityListPrimaryCell,
} from '@/components/shared/entity-list-table';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import type { BonusEntryListRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

function handleBonusRowKeyDown(
  event: KeyboardEvent<HTMLTableRowElement>,
  row: BonusEntryListRow,
  onOpenReleases: (entry: BonusEntryListRow) => void,
): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onOpenReleases(row);
}

export function BonusBoardListView({
  rows,
  boardScope,
  onOpenReleases,
}: {
  rows: BonusEntryListRow[];
  boardScope: BoardLifecycleScope;
  onOpenReleases: (entry: BonusEntryListRow) => void;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Gift}
        title="No matching entries"
        description="Adjust search or filters to see bonus lines."
        action={null}
      />
    );
  }

  const statusColumnLabel = boardScope === 'CLOSED' ? 'Outcome' : 'Status';

  return (
    <div className={ENTITY_LIST_SCROLL_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Employee</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Project</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Type</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{statusColumnLabel}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const typeCfg = BONUS_BOARD_TYPE_CONFIG[row.type];
            const projectName = row.project?.name?.trim() || null;
            return (
              <TableRow
                key={row.id}
                className={cn(ENTITY_LIST_ROW_HOVER_CLASS, 'cursor-pointer')}
                onClick={() => onOpenReleases(row)}
                onKeyDown={(event) => handleBonusRowKeyDown(event, row, onOpenReleases)}
                tabIndex={0}
                role="button"
                aria-label={`${employeeDisplayName(row.employee)} · ${projectName ?? '—'} · bonus`}
              >
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  <EntityListPrimaryCell title={employeeDisplayName(row.employee)} />
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {projectName ? (
                    <EntityListIconLabel
                      icon={FolderKanban}
                      iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
                      label={projectName}
                    />
                  ) : (
                    <EntityListMutedDash />
                  )}
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                      typeCfg.color,
                    )}
                  >
                    {typeCfg.label}
                  </span>
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  <StatusBadge
                    label={BONUS_ENTRY_STATUS_LABEL[row.status]}
                    variant={BONUS_ENTRY_STATUS_VARIANT[row.status]}
                    className={ENTITY_LIST_BADGE_CLASS}
                  />
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  <EntityListAmount amount={parseBonusAmount(row.amount)} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
