import { Building2, FileText, FolderKanban, Plus } from 'lucide-react';
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
import {
  FINANCE_LIST_BADGE_CLASS,
  FINANCE_LIST_CELL_CLASS,
  FINANCE_LIST_HEAD_CLASS,
  FINANCE_LIST_ROW_HOVER_CLASS,
  FINANCE_LIST_SHELL_CLASS,
  FINANCE_LIST_TYPE_CLASS,
  FinanceListAmount,
  FinanceListDate,
  FinanceListIconLabel,
  FinanceListIconTile,
  FinanceListMutedDash,
  FinanceListPrimaryCell,
} from '@/features/finance/components/shared/finance-list-table';
import { getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import type { Order } from '@/lib/api/finance';
import { OrderListCoverageCell } from './OrderListCoverageCell';
import { formatOrderPaidSubline, getOrderTotalAmount } from './order-display-utils';
import { ORDER_STATUSES } from './order-statuses';

interface OrdersTableProps {
  orders: Order[];
  boardScope: BoardLifecycleScope;
  onOrderClick: (order: Order) => void;
  onCreateInvoice: (order: Order) => void;
}

export function OrdersTable({
  orders,
  boardScope,
  onOrderClick,
  onCreateInvoice,
}: OrdersTableProps) {
  return (
    <div className={FINANCE_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Order</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Client</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Amount</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Coverage</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>
              {boardScope === 'CLOSED' ? 'Closed' : 'Status'}
            </TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Created</TableHead>
            <TableHead className={`${FINANCE_LIST_HEAD_CLASS} w-10 text-right`}>
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
  const typeLabel = order.type.replace(/_/g, ' ').toUpperCase();
  const title = getOrderDisplayTitle(order);

  return (
    <TableRow className={FINANCE_LIST_ROW_HOVER_CLASS} onClick={() => onOrderClick(order)}>
      <TableCell className={`${FINANCE_LIST_CELL_CLASS} max-w-[16rem]`}>
        <FinanceListPrimaryCell title={title} subtitle={order.code} subtitleIcon={FileText} />
        <p className={`${FINANCE_LIST_TYPE_CLASS} mt-1`}>{typeLabel}</p>
      </TableCell>
      <TableCell className={`${FINANCE_LIST_CELL_CLASS} max-w-[14rem]`}>
        <OrderClientCell order={order} />
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <FinanceListAmount amount={total} currency={order.currency} />
        {paidSubline ? (
          <p className="text-muted-foreground mt-1 text-xs tabular-nums">{paidSubline}</p>
        ) : null}
      </TableCell>
      <TableCell className={`${FINANCE_LIST_CELL_CLASS} min-w-[8.5rem]`}>
        <OrderListCoverageCell order={order} />
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        {statusCfg ? (
          <StatusBadge
            label={statusCfg.label}
            variant={statusCfg.variant}
            className={FINANCE_LIST_BADGE_CLASS}
          />
        ) : null}
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <FinanceListDate value={order.createdAt} />
      </TableCell>
      <TableCell className={`${FINANCE_LIST_CELL_CLASS} text-right`}>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={`Create invoice for ${title}`}
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
    <div className="flex flex-col gap-1.5">
      {order.company?.name ? (
        <FinanceListIconLabel
          icon={Building2}
          iconClassName="bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
          label={order.company.name}
        />
      ) : (
        <FinanceListMutedDash />
      )}
      {order.project ? (
        <span className="flex min-w-0 items-center gap-2">
          <FinanceListIconTile
            icon={FolderKanban}
            className="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
          />
          <span className="text-muted-foreground truncate text-xs">{order.project.name}</span>
        </span>
      ) : null}
    </div>
  );
}
