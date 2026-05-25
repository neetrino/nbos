'use client';

import { useMemo } from 'react';
import { KanbanBoard, KanbanColumnMoneyTotal } from '@/components/shared';
import { resolveKanbanStageHex } from '@/components/shared/kanban/kanban-stage-hex';
import { BonusPoolsPoolCard } from '@/features/finance/components/bonus/bonus-pools-pool-card';
import {
  BONUS_POOL_BOARD_LANE_COLOR,
  BONUS_POOL_BOARD_LANE_LABEL,
  BONUS_POOL_BOARD_LANE_ORDER,
  groupPoolsByBoardLane,
  type BonusPoolBoardLane,
} from '@/features/finance/utils/bonus-pool-board-lane';
import { parseBonusPoolAmount } from '@/features/finance/utils/bonus-pool-amount';
import type { BonusPoolEmployeeLine, BonusProductPoolRow } from '@/lib/api/bonus';

const BOARD_COLUMN_WIDTH = 288;

export function BonusPoolsBoardView({
  rows,
  onOpenPool,
  linesByPoolKey,
}: {
  rows: BonusProductPoolRow[];
  onOpenPool: (row: BonusProductPoolRow) => void;
  linesByPoolKey: ReadonlyMap<string, BonusPoolEmployeeLine[]>;
}) {
  const lanes = useMemo(() => groupPoolsByBoardLane(rows), [rows]);

  const columns = useMemo(() => {
    return BONUS_POOL_BOARD_LANE_ORDER.map((lane: BonusPoolBoardLane) => {
      const color = BONUS_POOL_BOARD_LANE_COLOR[lane];
      return {
        key: lane,
        label: BONUS_POOL_BOARD_LANE_LABEL[lane],
        color,
        hexColor: resolveKanbanStageHex(color),
        items: lanes[lane],
        readonly: true,
      };
    });
  }, [lanes]);

  return (
    <div className="min-h-0 flex-1">
      <KanbanBoard
        columns={columns}
        columnWidth={BOARD_COLUMN_WIDTH}
        emptyMessage="No pools in this lane"
        getItemId={(row) => row.poolKey}
        renderColumnHeader={(column) => (
          <KanbanColumnMoneyTotal
            column={column}
            getAmount={(row) => parseBonusPoolAmount(row.ledgerAvailableFunding)}
          />
        )}
        renderCard={(row) => (
          <BonusPoolsPoolCard
            row={row}
            onOpen={onOpenPool}
            compact
            employeeLines={linesByPoolKey.get(row.poolKey)}
          />
        )}
      />
    </div>
  );
}
