'use client';

import type { KeyboardEvent } from 'react';
import { AlertTriangle, Building2, FolderKanban, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanCardShell, StatusBadge } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import type { Order } from '@/lib/api/finance';
import { cn } from '@/lib/utils';
import {
  formatOrderPaidSubline,
  getOrderCoveragePercents,
  getOrderTotalAmount,
} from './order-display-utils';

interface OrderBoardCardProps {
  order: Order;
  onOrderClick: (order: Order) => void;
  onCreateInvoice: (order: Order) => void;
}

export function OrderBoardCard({ order, onOrderClick, onCreateInvoice }: OrderBoardCardProps) {
  const total = getOrderTotalAmount(order);
  const paidSubline = formatOrderPaidSubline(order);
  const percents = getOrderCoveragePercents(order);
  const warnings = order.reconciliation?.warnings ?? [];
  const typeLabel = order.type.replace(/_/g, ' ');

  return (
    <KanbanCardShell
      as="article"
      radius="lg"
      padding="none"
      baseShadow="sm"
      hoverShadow="md"
      className="group relative"
    >
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'cursor-pointer space-y-2 rounded-lg p-3 pr-10',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        )}
        onClick={() => onOrderClick(order)}
        onKeyDown={(event) => handleCardKeyDown(event, order, onOrderClick)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{getOrderDisplayTitle(order)}</p>
            <p className="text-muted-foreground truncate text-xs">{order.code}</p>
          </div>
          <StatusBadge label={typeLabel} variant="gray" />
        </div>

        <p className="text-base font-bold tabular-nums">{formatAmount(total)}</p>
        {paidSubline ? (
          <p className="text-muted-foreground text-xs tabular-nums">{paidSubline}</p>
        ) : null}

        {percents ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <MiniCoverage label="Inv" percent={percents.invoicedPercent} />
            <MiniCoverage label="Paid" percent={percents.paidPercent} />
            {warnings.length > 0 ? (
              <AlertTriangle size={12} className="text-amber-600" aria-hidden />
            ) : null}
          </div>
        ) : null}

        <div className="text-muted-foreground space-y-1 text-xs">
          {order.company ? (
            <p className="flex items-center gap-1 truncate">
              <Building2 size={11} aria-hidden />
              {order.company.name}
            </p>
          ) : null}
          {order.project ? (
            <p className="flex items-center gap-1 truncate">
              <FolderKanban size={11} aria-hidden />
              {order.project.name}
            </p>
          ) : null}
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 size-7 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        aria-label={`Create invoice for ${getOrderDisplayTitle(order)}`}
        onClick={(event) => {
          event.stopPropagation();
          onCreateInvoice(order);
        }}
      >
        <Plus size={14} aria-hidden />
      </Button>
    </KanbanCardShell>
  );
}

function MiniCoverage({ label, percent }: { label: string; percent: number }) {
  return (
    <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
      {label} {percent}%
    </span>
  );
}

function handleCardKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  order: Order,
  onOrderClick: (order: Order) => void,
): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onOrderClick(order);
}
