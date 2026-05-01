import { DollarSign, FolderKanban, Plus } from 'lucide-react';
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
import type { Order } from '@/lib/api/finance';
import { OrderReconciliationCell } from './OrderReconciliationCell';
import { ORDER_STATUSES } from './order-statuses';

interface OrdersTableProps {
  orders: Order[];
  onCreateInvoice: (order: Order) => void;
}

export function OrdersTable({ orders, onCreateInvoice }: OrdersTableProps) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reconciliation</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} onCreateInvoice={onCreateInvoice} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function OrderRow({
  order,
  onCreateInvoice,
}: {
  order: Order;
  onCreateInvoice: (order: Order) => void;
}) {
  const statusCfg = ORDER_STATUSES[order.status];

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{order.code}</p>
      </TableCell>
      <TableCell>
        <OrderProject order={order} />
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">{order.company?.name ?? '—'}</TableCell>
      <TableCell className="text-xs">{order.type}</TableCell>
      <TableCell className="text-right">
        <OrderAmount order={order} />
      </TableCell>
      <TableCell className="text-xs">{order.paymentType}</TableCell>
      <TableCell>
        {statusCfg && <StatusBadge label={statusCfg.label} variant={statusCfg.variant} />}
      </TableCell>
      <TableCell>
        <OrderReconciliationCell order={order} />
      </TableCell>
      <TableCell className="text-right">
        <Button variant="outline" size="sm" onClick={() => onCreateInvoice(order)}>
          <Plus size={14} />
          Create Invoice
        </Button>
      </TableCell>
    </TableRow>
  );
}

function OrderProject({ order }: { order: Order }) {
  if (!order.project) {
    return '—';
  }

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <FolderKanban size={12} className="text-muted-foreground" />
      {order.project.name}
    </div>
  );
}

function OrderAmount({ order }: { order: Order }) {
  const total = Number(order.amount ?? order.totalAmount ?? 0);

  return (
    <span className="flex items-center justify-end gap-1 font-semibold">
      <DollarSign size={12} className="text-accent" />
      {formatAmount(total)}
    </span>
  );
}
