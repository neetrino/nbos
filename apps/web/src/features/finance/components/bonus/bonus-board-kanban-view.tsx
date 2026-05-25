'use client';

import { useMemo } from 'react';
import { KanbanBoard, KanbanColumnMoneyTotal } from '@/components/shared';
import { resolveKanbanStageHex } from '@/components/shared/kanban/kanban-stage-hex';
import {
  BonusCard,
  parseBonusAmount,
} from '@/features/finance/components/bonus/bonus-board-widgets';
import {
  bonusEntriesForKanbanColumn,
  visibleBonusBoardKanbanColumns,
} from '@/features/finance/constants/bonus-board-lifecycle';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import type { BonusEntryListRow } from '@/lib/api/bonus';

const BONUS_KANBAN_COLUMN_WIDTH_ACTIVE = 270;
const BONUS_KANBAN_COLUMN_WIDTH_CLOSED = 288;

export function BonusBoardKanbanView({
  rows,
  boardScope,
  onOpenReleases,
}: {
  rows: BonusEntryListRow[];
  boardScope: BoardLifecycleScope;
  onOpenReleases?: (entry: BonusEntryListRow) => void;
}) {
  const columns = useMemo(() => {
    return visibleBonusBoardKanbanColumns(boardScope).map((column) => ({
      key: column.key,
      label: column.label,
      color: column.color,
      hexColor: resolveKanbanStageHex(column.color),
      items: bonusEntriesForKanbanColumn(rows, column.key) as BonusEntryListRow[],
      readonly: true,
    }));
  }, [boardScope, rows]);

  const readOnly = boardScope === 'CLOSED';

  return (
    <div className="min-h-0 flex-1">
      <KanbanBoard
        columns={columns}
        columnWidth={
          boardScope === 'CLOSED'
            ? BONUS_KANBAN_COLUMN_WIDTH_CLOSED
            : BONUS_KANBAN_COLUMN_WIDTH_ACTIVE
        }
        emptyMessage="No bonuses"
        getItemId={(row) => row.id}
        renderColumnHeader={(column) => (
          <KanbanColumnMoneyTotal
            column={column}
            getAmount={(row) => parseBonusAmount(row.amount)}
          />
        )}
        renderCard={(row) => (
          <BonusCard row={row} onOpenReleases={onOpenReleases} readOnly={readOnly} />
        )}
      />
    </div>
  );
}
