'use client';

import Link from 'next/link';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  bonusPoolFundingHealthUi,
  formatPoolFillPercent,
  resolveRowFundingHealth,
} from '@/features/finance/constants/bonus-pool-funding-health-ui';
import { StatusBadge } from '@/components/shared';
import {
  bonusPoolKindLabel,
  bonusPoolOrderCodesLabel,
  bonusPoolScopeTitle,
} from '@/features/finance/utils/bonus-pool-display';
import { BonusPoolFillBar } from '@/features/finance/components/bonus/bonus-pool-fill-bar';
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
  const planned = parseBonusPoolAmount(row.ledgerPlannedAmount);
  const available = parseBonusPoolAmount(row.ledgerAvailableFunding);
  const remaining = parseBonusPoolAmount(row.ledgerRemainingAmount);
  const preview = employeeLines ? topBonusPoolEmployeePreviewLines(employeeLines) : [];

  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className={cn(
        'border-border bg-card hover:bg-muted/30 w-full rounded-lg border px-3 py-2.5 text-left transition-colors',
        compact ? 'py-2' : 'py-3',
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="text-foreground line-clamp-2 text-sm font-semibold">
          {bonusPoolScopeTitle(row)}
        </span>
        <span className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
          {bonusPoolKindLabel(row.poolKind)}
        </span>
      </div>
      <dl className="text-muted-foreground mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
        <dt>Order</dt>
        <dd className="text-foreground font-mono font-medium">{bonusPoolOrderCodesLabel(row)}</dd>
        <dt>Team</dt>
        <dd className="text-foreground tabular-nums">{row.employeeCount}</dd>
        <dt>Project</dt>
        <dd>
          <Link
            href={`/projects/${row.projectId}`}
            className="text-primary hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {row.projectCode}
          </Link>
        </dd>
      </dl>
      <div className="mt-2">
        <BonusPoolFillBar row={row} showLabel={false} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <StatusBadge label={fundingUi.label} variant={fundingUi.variant} />
        <span className="font-semibold tabular-nums">
          {formatPoolFillPercent(row.fundingFillPercent)}
        </span>
        <span className="text-muted-foreground tabular-nums">
          Avail {formatAmount(available)} · Rem {formatAmount(remaining)}
        </span>
      </div>
      {preview.length > 0 ? (
        <ul className="text-muted-foreground mt-2 space-y-0.5 text-xs">
          {preview.map((line) => (
            <li key={line.employeeId} className="truncate">
              {formatBonusPoolEmployeePreviewLine(line)}
            </li>
          ))}
        </ul>
      ) : null}
      {!compact ? (
        <p className="text-muted-foreground mt-1 text-xs tabular-nums">
          Planned {formatAmount(planned)} · {row.entryCount} entries
        </p>
      ) : null}
    </button>
  );
}
