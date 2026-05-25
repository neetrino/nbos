'use client';

import { Gift } from 'lucide-react';
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
import { formatAmount } from '@/features/finance/constants/finance';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import type { BonusEntryListRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

const LIST_ROW_CELL = 'px-4 py-3 align-middle';
const LIST_HEAD_CELL = 'px-4 py-3';

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
    <div className="border-border bg-card overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={LIST_HEAD_CELL}>Employee</TableHead>
            <TableHead className={LIST_HEAD_CELL}>Project</TableHead>
            <TableHead className={LIST_HEAD_CELL}>Type</TableHead>
            <TableHead className={LIST_HEAD_CELL}>{statusColumnLabel}</TableHead>
            <TableHead className={`${LIST_HEAD_CELL} text-right`}>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const typeCfg = BONUS_BOARD_TYPE_CONFIG[row.type];
            const projectCode = row.project?.code ?? '—';
            return (
              <TableRow
                key={row.id}
                className="bg-card hover:bg-muted/40 cursor-pointer border-b"
                onClick={() => onOpenReleases(row)}
                onKeyDown={(event) => handleBonusRowKeyDown(event, row, onOpenReleases)}
                tabIndex={0}
                role="button"
                aria-label={`${employeeDisplayName(row.employee)} · ${projectCode} · ${formatAmount(parseBonusAmount(row.amount))}`}
              >
                <TableCell className={cn(LIST_ROW_CELL, 'font-medium')}>
                  {employeeDisplayName(row.employee)}
                </TableCell>
                <TableCell className={LIST_ROW_CELL}>{projectCode}</TableCell>
                <TableCell className={LIST_ROW_CELL}>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${typeCfg.color}`}
                  >
                    {typeCfg.label}
                  </span>
                </TableCell>
                <TableCell className={LIST_ROW_CELL}>
                  <StatusBadge
                    label={BONUS_ENTRY_STATUS_LABEL[row.status]}
                    variant={BONUS_ENTRY_STATUS_VARIANT[row.status]}
                    className="text-[10px]"
                  />
                </TableCell>
                <TableCell
                  className={`${LIST_ROW_CELL} text-right text-sm font-semibold tabular-nums`}
                >
                  {formatAmount(parseBonusAmount(row.amount))}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
