'use client';

import { useMemo } from 'react';
import { formatAmount } from '@/features/finance/constants/finance';
import type { Order } from '@/lib/api/finance';
import { cn } from '@/lib/utils';
import { ORDER_BOARD_COLUMN_ORDER, ORDER_BOARD_LANE_HEADER_CLASS } from './order-board-constants';
import { OrderBoardCard, orderBoardLaneLabel } from './OrderBoardCard';
import { getOrderTotalAmount } from './order-display-utils';

interface OrdersBoardViewProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onCreateInvoice: (order: Order) => void;
}

export function OrdersBoardView({ orders, onOrderClick, onCreateInvoice }: OrdersBoardViewProps) {
  const lanes = useMemo(() => groupOrdersByStatus(orders), [orders]);

  return (
    <div className="flex min-h-[24rem] flex-1 gap-3 overflow-x-auto pb-1">
      {ORDER_BOARD_COLUMN_ORDER.map((status) => {
        const laneItems = lanes[status] ?? [];
        const laneTotal = laneItems.reduce((sum, order) => sum + getOrderTotalAmount(order), 0);

        return (
          <section
            key={status}
            className="border-border bg-muted/15 flex w-[17.5rem] shrink-0 flex-col rounded-xl border"
          >
            <header
              className={cn(
                'border-border border-b px-3 py-2.5',
                ORDER_BOARD_LANE_HEADER_CLASS[status],
              )}
            >
              <p className="text-sm font-semibold">{orderBoardLaneLabel(status)}</p>
              <p className="text-muted-foreground text-xs tabular-nums">
                {laneItems.length} · {formatAmount(laneTotal)}
              </p>
            </header>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
              {laneItems.length === 0 ? (
                <p className="text-muted-foreground px-1 py-6 text-center text-xs">No orders</p>
              ) : (
                laneItems.map((order) => (
                  <OrderBoardCard
                    key={order.id}
                    order={order}
                    onOrderClick={onOrderClick}
                    onCreateInvoice={onCreateInvoice}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
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
