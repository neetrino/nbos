'use client';

import { useMemo } from 'react';
import { KanbanBoard, KanbanColumnMoneyTotal } from '@/components/shared';
import { resolveKanbanStageHex } from '@/components/shared/kanban/kanban-stage-hex';
import { ORDER_BOARD_STAGES } from '@/features/finance/constants/order-board-lifecycle';
import { getBoardStageKeys, type BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import type { StageColumnMeta } from '@/features/shared/kanban/use-stage-column-board';
import type { Order } from '@/lib/api/finance';
import {
  ORDER_BOARD_COLUMN_WIDTH,
  ORDER_BOARD_COLUMN_WIDTH_CLOSED,
  ORDER_BOARD_STAGE_COLORS,
} from './order-board-constants';
import { OrderBoardCard } from './OrderBoardCard';
import { getOrderTotalAmount } from './order-display-utils';
import { orderStatusLabel } from './order-statuses';

interface OrdersBoardViewProps {
  orders: Order[];
  boardScope: BoardLifecycleScope;
  columnMeta?: Record<string, StageColumnMeta>;
  onColumnLoadMore?: (columnKey: string) => void;
  onOrderClick: (order: Order) => void;
}

export function OrdersBoardView({
  orders,
  boardScope,
  columnMeta,
  onColumnLoadMore,
  onOrderClick,
}: OrdersBoardViewProps) {
  const lanes = useMemo(() => groupOrdersByStatus(orders), [orders]);
  const visibleKeys = getBoardStageKeys(ORDER_BOARD_STAGES, boardScope);

  const columns = useMemo(
    () =>
      visibleKeys.map((status) => {
        const color = ORDER_BOARD_STAGE_COLORS[status as keyof typeof ORDER_BOARD_STAGE_COLORS];
        const meta = columnMeta?.[status];
        return {
          key: status,
          label: orderStatusLabel(status),
          color: color ?? 'bg-gray-400',
          hexColor: resolveKanbanStageHex(color ?? 'bg-gray-400'),
          items: lanes[status] ?? [],
          readonly: true,
          totalCount: meta?.totalCount,
          hasMore: meta?.hasMore,
          loadingMore: meta?.loadingMore,
        };
      }),
    [columnMeta, lanes, visibleKeys],
  );

  return (
    <div className="min-h-0 flex-1">
      <KanbanBoard
        columns={columns}
        columnWidth={
          boardScope === 'CLOSED' ? ORDER_BOARD_COLUMN_WIDTH_CLOSED : ORDER_BOARD_COLUMN_WIDTH
        }
        emptyMessage="No orders"
        getItemId={(order) => order.id}
        onColumnLoadMore={onColumnLoadMore}
        renderColumnHeader={(column) => (
          <KanbanColumnMoneyTotal
            column={column}
            getAmount={(order) => String(getOrderTotalAmount(order))}
          />
        )}
        renderCard={(order) => <OrderBoardCard order={order} onOrderClick={onOrderClick} />}
      />
    </div>
  );
}

function groupOrdersByStatus(orders: Order[]): Record<string, Order[]> {
  const grouped: Record<string, Order[]> = {};

  for (const order of orders) {
    const lane = grouped[order.status] ?? [];
    lane.push(order);
    grouped[order.status] = lane;
  }

  return grouped;
}
