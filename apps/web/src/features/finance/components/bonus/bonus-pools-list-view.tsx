'use client';

import Link from 'next/link';
import { type KeyboardEvent } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  bonusPoolListRowClass,
  bonusPoolStatusUi,
} from '@/features/finance/constants/bonus-pool-status-ui';
import type { BonusPoolsFilteredTotals } from '@/features/finance/utils/bonus-pools-filtered-totals';
import { formatBonusPoolMoney } from '@/features/finance/utils/bonus-pool-amount';
import type { BonusProductPoolRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

const LIST_ROW_CELL = 'px-4 py-4 align-middle';
const LIST_HEAD_CELL = 'px-4 py-3';
const LIST_FOOTER_CELL = 'text-foreground px-4 py-3 text-sm font-bold tabular-nums';
const LIST_FOOTER_LABEL =
  'text-muted-foreground px-4 py-3 text-xs font-semibold uppercase tracking-wide';

function handlePoolRowKeyDown(
  event: KeyboardEvent<HTMLTableRowElement>,
  row: BonusProductPoolRow,
  onOpenPool: (row: BonusProductPoolRow) => void,
): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onOpenPool(row);
}

export function BonusPoolsListView({
  rows,
  totals,
  onOpenPool,
}: {
  rows: BonusProductPoolRow[];
  totals: BonusPoolsFilteredTotals;
  onOpenPool: (row: BonusProductPoolRow) => void;
}) {
  return (
    <div className="border-border overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={LIST_HEAD_CELL}>Pool</TableHead>
            <TableHead className={LIST_HEAD_CELL}>Project</TableHead>
            <TableHead className={`${LIST_HEAD_CELL} text-right`}>Received</TableHead>
            <TableHead className={`${LIST_HEAD_CELL} text-right`}>Planned</TableHead>
            <TableHead className={`${LIST_HEAD_CELL} text-right`}>Released</TableHead>
            <TableHead className={`${LIST_HEAD_CELL} text-right`}>Available</TableHead>
            <TableHead className={`${LIST_HEAD_CELL} text-right`}>Remaining</TableHead>
            <TableHead className={LIST_HEAD_CELL}>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <BonusPoolsListRow key={row.poolKey} row={row} onOpenPool={onOpenPool} />
          ))}
        </TableBody>
        <tfoot>
          <TableRow className="bg-muted/30 font-medium">
            <TableCell colSpan={2} className={LIST_FOOTER_LABEL}>
              Filtered ({totals.poolCount} pools · {totals.entryCount} entries)
            </TableCell>
            <TableCell className={`${LIST_FOOTER_CELL} text-right`}>—</TableCell>
            <TableCell className={`${LIST_FOOTER_CELL} text-right`}>
              {formatAmount(totals.planned)}
            </TableCell>
            <TableCell className={`${LIST_FOOTER_CELL} text-right`}>
              {formatAmount(totals.released)}
            </TableCell>
            <TableCell className={`${LIST_FOOTER_CELL} text-right`}>
              {formatAmount(totals.available)}
            </TableCell>
            <TableCell className={`${LIST_FOOTER_CELL} text-right`}>—</TableCell>
            <TableCell />
          </TableRow>
        </tfoot>
      </Table>
    </div>
  );
}

function BonusPoolsListRow({
  row,
  onOpenPool,
}: {
  row: BonusProductPoolRow;
  onOpenPool: (row: BonusProductPoolRow) => void;
}) {
  const statusUi = bonusPoolStatusUi(row.ledgerPoolStatus);

  return (
    <TableRow
      className={cn('cursor-pointer', bonusPoolListRowClass(row))}
      onClick={() => onOpenPool(row)}
      onKeyDown={(event) => handlePoolRowKeyDown(event, row, onOpenPool)}
      tabIndex={0}
      role="button"
      aria-label={`${row.poolName} · ${statusUi.label}`}
    >
      <TableCell className={LIST_ROW_CELL}>
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-semibold">{row.poolName}</span>
          <span className="text-xs opacity-80">
            {row.poolKind} · {row.orderCode}
          </span>
        </div>
      </TableCell>
      <TableCell className={LIST_ROW_CELL}>
        <Link
          href={`/projects/${row.projectId}`}
          className="font-medium hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {row.projectCode}
        </Link>
      </TableCell>
      <TableCell className={`${LIST_ROW_CELL} text-right text-sm tabular-nums`}>
        {formatBonusPoolMoney(row.ledgerReceivedAmount)}
      </TableCell>
      <TableCell className={`${LIST_ROW_CELL} text-right text-sm font-medium tabular-nums`}>
        {formatBonusPoolMoney(row.ledgerPlannedAmount)}
      </TableCell>
      <TableCell className={`${LIST_ROW_CELL} text-right text-sm tabular-nums`}>
        {formatBonusPoolMoney(row.ledgerReleasedAmount)}
      </TableCell>
      <TableCell className={`${LIST_ROW_CELL} text-right text-sm font-medium tabular-nums`}>
        {formatBonusPoolMoney(row.ledgerAvailableFunding)}
      </TableCell>
      <TableCell className={`${LIST_ROW_CELL} text-right text-sm tabular-nums`}>
        {formatBonusPoolMoney(row.ledgerRemainingAmount)}
      </TableCell>
      <TableCell className={LIST_ROW_CELL}>
        <span className="text-xs font-semibold tracking-wide uppercase">{statusUi.label}</span>
      </TableCell>
    </TableRow>
  );
}
