'use client';

import Link from 'next/link';
import { formatAmount } from '@/features/finance/constants/finance';
import { bonusPoolStatusUi } from '@/features/finance/constants/bonus-pool-status-ui';
import { parseBonusPoolAmount } from '@/features/finance/utils/bonus-pool-amount';
import type { BonusProductPoolRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

export function BonusPoolsPoolCard({
  row,
  onOpen,
  compact,
}: {
  row: BonusProductPoolRow;
  onOpen: (row: BonusProductPoolRow) => void;
  compact?: boolean;
}) {
  const statusUi = bonusPoolStatusUi(row.ledgerPoolStatus);
  const planned = parseBonusPoolAmount(row.ledgerPlannedAmount);
  const available = parseBonusPoolAmount(row.ledgerAvailableFunding);
  const remaining = parseBonusPoolAmount(row.ledgerRemainingAmount);

  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className={cn(
        'border-border bg-card hover:bg-muted/30 w-full rounded-lg border px-3 py-2.5 text-left transition-colors',
        compact ? 'py-2' : 'py-3',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-foreground line-clamp-2 text-sm font-semibold">{row.poolName}</span>
        <span className="text-muted-foreground shrink-0 text-[10px] font-semibold uppercase">
          {row.poolKind}
        </span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        <Link
          href={`/projects/${row.projectId}`}
          className="text-primary hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {row.projectCode}
        </Link>
        {' · '}
        {row.orderCode}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="font-semibold tracking-wide uppercase">{statusUi.label}</span>
        <span className="tabular-nums">
          Avail {formatAmount(available)} · Rem {formatAmount(remaining)}
        </span>
      </div>
      {!compact ? (
        <p className="text-muted-foreground mt-1 text-xs tabular-nums">
          Planned {formatAmount(planned)} · {row.entryCount} entries
        </p>
      ) : null}
    </button>
  );
}
