'use client';

import { useMemo } from 'react';
import { formatAmount } from '@/features/finance/constants/finance';
import { BonusPoolsPoolCard } from '@/features/finance/components/bonus/bonus-pools-pool-card';
import {
  BONUS_POOL_BOARD_LANE_LABEL,
  BONUS_POOL_BOARD_LANE_ORDER,
  groupPoolsByBoardLane,
  type BonusPoolBoardLane,
} from '@/features/finance/utils/bonus-pool-board-lane';
import { parseBonusPoolAmount } from '@/features/finance/utils/bonus-pool-amount';
import type { BonusProductPoolRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

const BONUS_POOL_BOARD_LANE_HEADER_CLASS: Record<BonusPoolBoardLane, string> = {
  at_risk: 'bg-muted/40',
  partial: 'bg-amber-100/90 dark:bg-amber-900/35',
  ready: 'bg-green-100/90 dark:bg-green-900/35',
  over: 'bg-red-100/90 dark:bg-red-950/40',
};

export function BonusPoolsBoardView({
  rows,
  onOpenPool,
}: {
  rows: BonusProductPoolRow[];
  onOpenPool: (row: BonusProductPoolRow) => void;
}) {
  const lanes = useMemo(() => groupPoolsByBoardLane(rows), [rows]);

  return (
    <div className="grid min-h-[24rem] flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {BONUS_POOL_BOARD_LANE_ORDER.map((lane) => {
        const items = lanes[lane];
        const laneTotal = items.reduce(
          (sum, row) => sum + parseBonusPoolAmount(row.ledgerAvailableFunding),
          0,
        );
        return (
          <section
            key={lane}
            className="border-border bg-muted/15 flex min-h-0 flex-col rounded-xl border"
          >
            <header
              className={cn(
                'border-border border-b px-3 py-2.5',
                BONUS_POOL_BOARD_LANE_HEADER_CLASS[lane],
              )}
            >
              <p className="text-sm font-semibold">{BONUS_POOL_BOARD_LANE_LABEL[lane]}</p>
              <p className="text-muted-foreground text-xs tabular-nums">
                {items.length} · Avail {formatAmount(laneTotal)}
              </p>
            </header>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
              {items.length === 0 ? (
                <p className="text-muted-foreground px-1 py-4 text-center text-xs">No pools</p>
              ) : (
                items.map((row) => (
                  <BonusPoolsPoolCard key={row.poolKey} row={row} onOpen={onOpenPool} compact />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
