'use client';

import { useMemo } from 'react';
import { KanbanBoard, KanbanColumnMoneyTotal } from '@/components/shared';
import { resolveKanbanStageHex } from '@/components/shared/kanban/kanban-stage-hex';
import type { Order } from '@/lib/api/finance';
import {
  ORDER_BOARD_COLUMN_ORDER,
  ORDER_BOARD_COLUMN_WIDTH,
  ORDER_BOARD_STAGE_COLORS,
} from './order-board-constants';
import { OrderBoardCard } from './OrderBoardCard';
import { getOrderTotalAmount } from './order-display-utils';
import { orderStatusLabel } from './order-statuses';

interface OrdersBoardViewProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onCreateInvoice: (order: Order) => void;
}

export function OrdersBoardView({ orders, onOrderClick, onCreateInvoice }: OrdersBoardViewProps) {
  const lanes = useMemo(() => groupOrdersByStatus(orders), [orders]);

  const columns = useMemo(
    () =>
      ORDER_BOARD_COLUMN_ORDER.map((status) => {
        const color = ORDER_BOARD_STAGE_COLORS[status];
        return {
          key: status,
          label: orderStatusLabel(status),
          color,
          hexColor: resolveKanbanStageHex(color),
          items: lanes[status] ?? [],
          readonly: true,
        };
      }),
    [lanes],
  );

  return (
    <div className="min-h-0 flex-1">
      <KanbanBoard
        columns={columns}
        columnWidth={ORDER_BOARD_COLUMN_WIDTH}
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
  const grouped = Object.fromEntries(
    ORDER_BOARD_COLUMN_ORDER.map((status) => [status, [] as Order[]]),
  ) as Record<string, Order[]>;

  for (const order of orders) {
    const lane = grouped[order.status] ?? grouped.NEW;
    if (lane) lane.push(order);
  }

  return grouped;
}
