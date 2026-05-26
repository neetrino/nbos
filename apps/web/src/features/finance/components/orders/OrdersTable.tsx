import { Building2, DollarSign, FolderKanban, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import type { Order } from '@/lib/api/finance';
import { OrderListCoverageCell } from './OrderListCoverageCell';
import {
  formatOrderPaidSubline,
  formatOrderShortDate,
  getOrderTotalAmount,
} from './order-display-utils';
import { ORDER_STATUSES } from './order-statuses';

interface OrdersTableProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onCreateInvoice: (order: Order) => void;
}

export function OrdersTable({ orders, onOrderClick, onCreateInvoice }: OrdersTableProps) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Coverage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-10 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onOrderClick={onOrderClick}
              onCreateInvoice={onCreateInvoice}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function OrderRow({
  order,
  onOrderClick,
  onCreateInvoice,
}: {
  order: Order;
  onOrderClick: (order: Order) => void;
  onCreateInvoice: (order: Order) => void;
}) {
  const statusCfg = ORDER_STATUSES[order.status];
  const total = getOrderTotalAmount(order);
  const paidSubline = formatOrderPaidSubline(order);
  const typeLabel = order.type.replace(/_/g, ' ');

  return (
    <TableRow className="hover:bg-muted/40 cursor-pointer" onClick={() => onOrderClick(order)}>
      <TableCell className="max-w-[14rem]">
        <p className="truncate font-medium">{getOrderDisplayTitle(order)}</p>
        <p className="text-muted-foreground truncate text-xs">
          {order.code} · {typeLabel}
        </p>
      </TableCell>
      <TableCell className="max-w-[12rem]">
        <OrderClientCell order={order} />
      </TableCell>
      <TableCell className="text-right">
        <p className="flex items-center justify-end gap-1 font-semibold tabular-nums">
          <DollarSign size={12} className="text-accent" aria-hidden />
          {formatAmount(total)}
        </p>
        {paidSubline ? (
          <p className="text-muted-foreground text-xs tabular-nums">{paidSubline}</p>
        ) : null}
      </TableCell>
      <TableCell className="min-w-[8.5rem]">
        <OrderListCoverageCell order={order} />
      </TableCell>
      <TableCell>
        {statusCfg ? <StatusBadge label={statusCfg.label} variant={statusCfg.variant} /> : null}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
        {formatOrderShortDate(order.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={`Create invoice for ${getOrderDisplayTitle(order)}`}
          onClick={(event) => {
            event.stopPropagation();
            onCreateInvoice(order);
          }}
        >
          <Plus size={14} aria-hidden />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function OrderClientCell({ order }: { order: Order }) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1 truncate text-sm">
        <Building2 size={12} className="text-muted-foreground shrink-0" aria-hidden />
        <span className="truncate">{order.company?.name ?? '—'}</span>
      </p>
      {order.project ? (
        <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
          <FolderKanban size={11} className="shrink-0" aria-hidden />
          <span className="truncate">{order.project.name}</span>
        </p>
      ) : null}
    </div>
  );
}
