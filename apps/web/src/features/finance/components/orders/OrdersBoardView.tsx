'use client';

import { useMemo } from 'react';
import { KanbanBoard, KanbanColumnMoneyTotal } from '@/components/shared';
import { resolveKanbanStageHex } from '@/components/shared/kanban/kanban-stage-hex';
import { ORDER_BOARD_STAGES } from '@/features/finance/constants/order-board-lifecycle';
import { getBoardStageKeys, type BoardLifecycleScope } from '@/features/shared/board-lifecycle';
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
  onOrderClick: (order: Order) => void;
  onCreateInvoice: (order: Order) => void;
}

export function OrdersBoardView({
  orders,
  boardScope,
  onOrderClick,
  onCreateInvoice,
}: OrdersBoardViewProps) {
  const lanes = useMemo(() => groupOrdersByStatus(orders), [orders]);
  const visibleKeys = getBoardStageKeys(ORDER_BOARD_STAGES, boardScope);

  const columns = useMemo(
    () =>
      visibleKeys.map((status) => {
        const color = ORDER_BOARD_STAGE_COLORS[status as keyof typeof ORDER_BOARD_STAGE_COLORS];
        return {
          key: status,
          label: orderStatusLabel(status),
          color: color ?? 'bg-gray-400',
          hexColor: resolveKanbanStageHex(color ?? 'bg-gray-400'),
          items: lanes[status] ?? [],
          readonly: true,
        };
      }),
    [lanes, visibleKeys],
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
        renderColumnHeader={(column) => (
          <KanbanColumnMoneyTotal
            column={column}
            getAmount={(order) => String(getOrderTotalAmount(order))}
          />
        )}
        renderCard={(order) => (
          <OrderBoardCard
            order={order}
            onOrderClick={onOrderClick}
            onCreateInvoice={onCreateInvoice}
          />
        )}
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
