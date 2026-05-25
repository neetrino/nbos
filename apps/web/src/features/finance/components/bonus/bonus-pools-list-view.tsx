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
  bonusPoolFundingHealthUi,
  bonusPoolFundingRowAccentForRow,
  resolveRowFundingHealth,
} from '@/features/finance/constants/bonus-pool-funding-health-ui';
import { BonusPoolFillBar } from '@/features/finance/components/bonus/bonus-pool-fill-bar';
import { StatusBadge } from '@/components/shared';
import type { BonusPoolsFilteredTotals } from '@/features/finance/utils/bonus-pools-filtered-totals';
import {
  BONUS_POOL_SCOPE_COLUMN_LABEL,
  bonusPoolKindLabel,
  bonusPoolScopeTitle,
} from '@/features/finance/utils/bonus-pool-display';
import { formatBonusPoolMoney } from '@/features/finance/utils/bonus-pool-amount';
import type { BonusProductPoolRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

const LIST_ROW_CELL = 'px-4 py-3 align-middle';
const LIST_HEAD_CELL = 'px-4 py-3';
const LIST_FOOTER_CELL = 'text-foreground px-4 py-3 text-sm font-bold tabular-nums';
const LIST_FOOTER_LABEL =
  'text-muted-foreground px-4 py-3 text-xs font-semibold uppercase tracking-wide';
const LIST_SCOPE_COL_CLASS = 'min-w-[12rem]';
const LIST_PROJECT_COL_CLASS = 'min-w-[7rem]';
const LIST_FILL_COL_CLASS = 'min-w-[5rem]';
const LIST_IDENTITY_COLS = 2;

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
    <div className="border-border bg-card overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={cn(LIST_HEAD_CELL, LIST_SCOPE_COL_CLASS)}>
              {BONUS_POOL_SCOPE_COLUMN_LABEL}
            </TableHead>
            <TableHead className={cn(LIST_HEAD_CELL, LIST_PROJECT_COL_CLASS)}>Project</TableHead>
            <TableHead className={`${LIST_HEAD_CELL} text-right`}>Available</TableHead>
            <TableHead className={cn(LIST_HEAD_CELL, LIST_FILL_COL_CLASS)}>Fill</TableHead>
            <TableHead className={LIST_HEAD_CELL}>Funding</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <BonusPoolsListRow key={row.poolKey} row={row} onOpenPool={onOpenPool} />
          ))}
        </TableBody>
        <tfoot>
          <TableRow className="bg-muted/30 font-medium">
            <TableCell colSpan={LIST_IDENTITY_COLS} className={LIST_FOOTER_LABEL}>
              Filtered ({totals.poolCount} pools · {totals.entryCount} entries)
            </TableCell>
            <TableCell className={`${LIST_FOOTER_CELL} text-right`}>
              {formatAmount(totals.available)}
            </TableCell>
            <TableCell />
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
  const fundingUi = bonusPoolFundingHealthUi(resolveRowFundingHealth(row));
  const scopeTitle = bonusPoolScopeTitle(row);

  return (
    <TableRow
      className={cn(
        'bg-card hover:bg-muted/40 cursor-pointer border-b',
        bonusPoolFundingRowAccentForRow(row),
      )}
      onClick={() => onOpenPool(row)}
      onKeyDown={(event) => handlePoolRowKeyDown(event, row, onOpenPool)}
      tabIndex={0}
      role="button"
      aria-label={`${scopeTitle} · ${row.projectCode}`}
    >
      <TableCell className={cn(LIST_ROW_CELL, LIST_SCOPE_COL_CLASS)}>
        <span className="text-base font-semibold">{scopeTitle}</span>
        <span className="text-muted-foreground mt-0.5 block text-xs font-medium tracking-wide uppercase">
          {bonusPoolKindLabel(row.poolKind)}
        </span>
      </TableCell>
      <TableCell className={cn(LIST_ROW_CELL, LIST_PROJECT_COL_CLASS)}>
        <Link
          href={`/projects/${row.projectId}`}
          className="font-semibold hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {row.projectCode}
        </Link>
      </TableCell>
      <TableCell className={`${LIST_ROW_CELL} text-right text-sm font-medium tabular-nums`}>
        {formatBonusPoolMoney(row.ledgerAvailableFunding)}
      </TableCell>
      <TableCell className={cn(LIST_ROW_CELL, LIST_FILL_COL_CLASS)}>
        <BonusPoolFillBar row={row} showLabel={false} className="max-w-[5.5rem]" />
      </TableCell>
      <TableCell className={LIST_ROW_CELL}>
        <StatusBadge
          label={fundingUi.label}
          variant={fundingUi.variant}
          className="w-fit text-[10px]"
        />
      </TableCell>
    </TableRow>
  );
}
