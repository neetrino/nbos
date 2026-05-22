'use client';

import Link from 'next/link';
import { formatAmount } from '@/features/finance/constants/finance';
import { bonusBoardHref } from '@/features/finance/constants/bonus-board-url';
import { BonusPoolAutoReleaseButton } from '@/features/finance/components/bonus/bonus-pool-auto-release-button';
import { summarizeBonusPoolSuggestedReleases } from '@/features/finance/utils/bonus-pool-suggested-release-summary';
import type { BonusPoolEmployeeLine, BonusProductPoolRow } from '@/lib/api/bonus';

const DELIVERY_AUTO_TYPES = new Set(['DELIVERY', 'PM', 'DESIGN']);

export function BonusPoolSheetSuggestedPanel({
  pool,
  lines,
  onAfterAutoRelease,
}: {
  pool: BonusProductPoolRow;
  lines: readonly BonusPoolEmployeeLine[];
  onAfterAutoRelease: () => void | Promise<void>;
}) {
  const summary = summarizeBonusPoolSuggestedReleases(pool, lines);
  const hasDeliveryLines = lines.some((line) =>
    line.bonusTypes.some((t) => DELIVERY_AUTO_TYPES.has(t)),
  );
  if (summary.employeeCountWithSuggestion === 0) {
    return (
      <p className="text-muted-foreground text-xs">
        No proportional release suggestion — check funding or remaining bonuses per employee.
      </p>
    );
  }

  return (
    <div className="border-border bg-muted/20 rounded-lg border px-3 py-2.5 text-sm">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <dt className="text-muted-foreground">Suggested total</dt>
        <dd className="text-right font-semibold tabular-nums">
          {formatAmount(summary.suggestedTotal)}
        </dd>
        <dt className="text-muted-foreground">Available funding</dt>
        <dd className="text-right font-semibold tabular-nums">
          {formatAmount(summary.availableFunding)}
        </dd>
        <dt className="text-muted-foreground">Can release now</dt>
        <dd className="text-right font-bold tabular-nums">{formatAmount(summary.releasableNow)}</dd>
      </dl>
      {summary.exceedsAvailable ? (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
          Suggested exceeds available funding — release partially or wait for client payments.
        </p>
      ) : null}
      <p className="text-muted-foreground mt-2 text-xs">
        Create releases on the{' '}
        <Link
          href={bonusBoardHref(pool.projectId)}
          className="text-primary font-medium hover:underline"
        >
          bonus board
        </Link>
        , then attach to payroll when approved.
      </p>
      {hasDeliveryLines ? (
        <BonusPoolAutoReleaseButton
          poolKey={pool.poolKey}
          disabled={summary.availableFunding <= 0}
          onComplete={onAfterAutoRelease}
        />
      ) : null}
    </div>
  );
}
