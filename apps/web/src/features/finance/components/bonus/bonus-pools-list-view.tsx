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
  formatPoolFillPercent,
  resolveRowFundingHealth,
} from '@/features/finance/constants/bonus-pool-funding-health-ui';
import { bonusPoolListRowClass } from '@/features/finance/constants/bonus-pool-status-ui';
import { StatusBadge } from '@/components/shared';
import type { BonusPoolsFilteredTotals } from '@/features/finance/utils/bonus-pools-filtered-totals';
import {
  BONUS_POOL_SCOPE_COLUMN_LABEL,
  bonusPoolKindLabel,
  bonusPoolOrderCodesLabel,
  bonusPoolScopeTitle,
} from '@/features/finance/utils/bonus-pool-display';
import { formatBonusPoolMoney } from '@/features/finance/utils/bonus-pool-amount';
import {
  formatBonusPoolEmployeePreviewLine,
  topBonusPoolEmployeePreviewLines,
} from '@/features/finance/utils/bonus-pool-employee-preview-label';
import type { BonusPoolEmployeeLine, BonusProductPoolRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

const LIST_ROW_CELL = 'px-4 py-4 align-middle';
const LIST_HEAD_CELL = 'px-4 py-3';
const LIST_FOOTER_CELL = 'text-foreground px-4 py-3 text-sm font-bold tabular-nums';
const LIST_FOOTER_LABEL =
  'text-muted-foreground px-4 py-3 text-xs font-semibold uppercase tracking-wide';
const LIST_SCOPE_COL_CLASS = 'min-w-[10rem]';
const LIST_ORDER_COL_CLASS = 'min-w-[6rem]';
const LIST_PROJECT_COL_CLASS = 'min-w-[9rem]';
const LIST_IDENTITY_COLS = 3;
const LIST_FILL_COL_CLASS = 'min-w-[4.5rem]';

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
  linesByPoolKey,
}: {
  rows: BonusProductPoolRow[];
  totals: BonusPoolsFilteredTotals;
  onOpenPool: (row: BonusProductPoolRow) => void;
  linesByPoolKey: ReadonlyMap<string, BonusPoolEmployeeLine[]>;
}) {
  return (
    <div className="border-border overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={cn(LIST_HEAD_CELL, LIST_SCOPE_COL_CLASS)}>
              {BONUS_POOL_SCOPE_COLUMN_LABEL}
            </TableHead>
            <TableHead className={cn(LIST_HEAD_CELL, LIST_ORDER_COL_CLASS)}>Order</TableHead>
            <TableHead className={cn(LIST_HEAD_CELL, LIST_PROJECT_COL_CLASS)}>Project</TableHead>
            <TableHead className={`${LIST_HEAD_CELL} text-right`}>Received</TableHead>
            <TableHead className={`${LIST_HEAD_CELL} text-right`}>Planned</TableHead>
            <TableHead className={`${LIST_HEAD_CELL} text-right`}>Released</TableHead>
            <TableHead className={`${LIST_HEAD_CELL} text-right`}>Available</TableHead>
            <TableHead className={`${LIST_HEAD_CELL} text-right`}>Remaining</TableHead>
            <TableHead className={cn(LIST_HEAD_CELL, LIST_FILL_COL_CLASS)}>Fill</TableHead>
            <TableHead className={LIST_HEAD_CELL}>Funding</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <BonusPoolsListRow
              key={row.poolKey}
              row={row}
              onOpenPool={onOpenPool}
              employeeLines={linesByPoolKey.get(row.poolKey)}
            />
          ))}
        </TableBody>
        <tfoot>
          <TableRow className="bg-muted/30 font-medium">
            <TableCell colSpan={LIST_IDENTITY_COLS} className={LIST_FOOTER_LABEL}>
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
  employeeLines,
}: {
  row: BonusProductPoolRow;
  onOpenPool: (row: BonusProductPoolRow) => void;
  employeeLines?: readonly BonusPoolEmployeeLine[];
}) {
  const fundingUi = bonusPoolFundingHealthUi(resolveRowFundingHealth(row));
  const scopeTitle = bonusPoolScopeTitle(row);
  const preview = employeeLines ? topBonusPoolEmployeePreviewLines(employeeLines, 2) : [];

  return (
    <TableRow
      className={cn('cursor-pointer', bonusPoolListRowClass(row))}
      onClick={() => onOpenPool(row)}
      onKeyDown={(event) => handlePoolRowKeyDown(event, row, onOpenPool)}
      tabIndex={0}
      role="button"
      aria-label={`${scopeTitle} · ${row.orderCode} · ${row.projectCode}`}
    >
      <TableCell className={cn(LIST_ROW_CELL, LIST_SCOPE_COL_CLASS)}>
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-semibold">{scopeTitle}</span>
          <span className="text-xs font-medium tracking-wide uppercase opacity-80">
            {bonusPoolKindLabel(row.poolKind)}
          </span>
          {preview.length > 0 ? (
            <span className="text-muted-foreground truncate text-xs">
              {preview.map((line) => formatBonusPoolEmployeePreviewLine(line)).join(' · ')}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell className={cn(LIST_ROW_CELL, LIST_ORDER_COL_CLASS)}>
        <span className="font-mono text-sm font-semibold" title={row.orderCodes.join(', ')}>
          {bonusPoolOrderCodesLabel(row)}
        </span>
        {row.employeeCount > 0 ? (
          <span className="text-muted-foreground text-xs">{row.employeeCount} people</span>
        ) : null}
      </TableCell>
      <TableCell className={cn(LIST_ROW_CELL, LIST_PROJECT_COL_CLASS)}>
        <Link
          href={`/projects/${row.projectId}`}
          className="font-semibold hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {row.projectCode}
        </Link>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">{row.projectName}</p>
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
      <TableCell className={cn(LIST_ROW_CELL, LIST_FILL_COL_CLASS)}>
        <span className="text-sm font-bold tabular-nums">
          {formatPoolFillPercent(row.fundingFillPercent)}
        </span>
      </TableCell>
      <TableCell className={LIST_ROW_CELL}>
        <StatusBadge label={fundingUi.label} variant={fundingUi.variant} />
      </TableCell>
    </TableRow>
  );
}
