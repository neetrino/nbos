'use client';

import Link from 'next/link';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  bonusPoolFundingHealthUi,
  bonusPoolFundingRowAccentForRow,
  formatPoolFillPercent,
  resolveRowFundingHealth,
} from '@/features/finance/constants/bonus-pool-funding-health-ui';
import { bonusPoolSheetStatusUi } from '@/features/finance/constants/bonus-pool-status-ui';
import { StatusBadge } from '@/components/shared';
import { BonusPoolFillBar } from '@/features/finance/components/bonus/bonus-pool-fill-bar';
import {
  bonusPoolKindLabel,
  bonusPoolOrderCodesLabel,
  bonusPoolScopeTitle,
} from '@/features/finance/utils/bonus-pool-display';
import { parseBonusPoolAmount } from '@/features/finance/utils/bonus-pool-amount';
import type { BonusPoolEmployeeLine, BonusProductPoolRow } from '@/lib/api/bonus';
import {
  formatBonusPoolEmployeePreviewLine,
  topBonusPoolEmployeePreviewLines,
} from '@/features/finance/utils/bonus-pool-employee-preview-label';
import { cn } from '@/lib/utils';

export function BonusPoolsPoolCard({
  row,
  onOpen,
  compact,
  employeeLines,
}: {
  row: BonusProductPoolRow;
  onOpen: (row: BonusProductPoolRow) => void;
  compact?: boolean;
  employeeLines?: readonly BonusPoolEmployeeLine[];
}) {
  const fundingUi = bonusPoolFundingHealthUi(resolveRowFundingHealth(row));
  const ledgerUi = bonusPoolSheetStatusUi(row);
  const available = parseBonusPoolAmount(row.ledgerAvailableFunding);
  const remaining = parseBonusPoolAmount(row.ledgerRemainingAmount);
  const preview = employeeLines
    ? topBonusPoolEmployeePreviewLines(employeeLines, compact ? 2 : 3)
    : [];

  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className={cn(
        'border-border bg-card hover:bg-muted/30 w-full rounded-xl border text-left shadow-sm transition-all hover:shadow-md',
        bonusPoolFundingRowAccentForRow(row),
        compact ? 'px-3 py-2.5' : 'px-3.5 py-3',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-foreground line-clamp-2 text-sm leading-snug font-semibold">
            {bonusPoolScopeTitle(row)}
          </p>
          <p className="text-muted-foreground mt-0.5 text-[10px] font-semibold tracking-wide uppercase">
            {bonusPoolKindLabel(row.poolKind)}
          </p>
        </div>
        <StatusBadge
          label={fundingUi.label}
          variant={fundingUi.variant}
          className="shrink-0 text-[10px]"
        />
      </div>

      <p className="text-foreground mt-2.5 text-lg font-bold tabular-nums">
        {formatAmount(available)}
        <span className="text-muted-foreground ml-1.5 text-xs font-normal">available</span>
      </p>

      <div className="mt-2">
        <BonusPoolFillBar row={row} showLabel={!compact} />
      </div>

      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
        <span className="font-mono font-medium">{bonusPoolOrderCodesLabel(row)}</span>
        <span aria-hidden>·</span>
        <Link
          href={`/projects/${row.projectId}`}
          className="text-primary hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {row.projectCode}
        </Link>
        <span aria-hidden>·</span>
        <span>{row.employeeCount} people</span>
        <span aria-hidden>·</span>
        <span className="tabular-nums">Rem {formatAmount(remaining)}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <StatusBadge label={ledgerUi.label} variant={ledgerUi.variant} className="text-[10px]" />
        <span className="text-muted-foreground text-[10px] font-semibold tabular-nums">
          {formatPoolFillPercent(row.fundingFillPercent)} fill
        </span>
      </div>

      {preview.length > 0 ? (
        <ul className="text-muted-foreground mt-2 space-y-0.5 border-t pt-2 text-[10px] leading-snug">
          {preview.map((line) => (
            <li key={line.employeeId} className="truncate">
              {formatBonusPoolEmployeePreviewLine(line)}
            </li>
          ))}
        </ul>
      ) : null}
    </button>
  );
}
