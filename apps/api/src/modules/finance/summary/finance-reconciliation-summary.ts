import type { PrismaClient } from '@nbos/database';
import { sumAmounts } from '../finance-status.utils';

interface InvoiceForReconciliation {
  amount: number | string | { toNumber(): number } | null;
  payments: Array<{ amount: number | string | { toNumber(): number } | null }>;
}

interface OrderForReconciliation {
  totalAmount: number | string | { toNumber(): number };
  invoices: InvoiceForReconciliation[];
}

interface ReconciliationRow {
  orderAmount: number;
  invoicedAmount: number;
  paidAmount: number;
  uninvoicedAmount: number;
  outstandingAmount: number;
  isFullyInvoiced: boolean;
  isFullyPaid: boolean;
}

export interface FinanceReconciliationWarning {
  code: 'UNINVOICED_ORDERS' | 'OUTSTANDING_ORDERS';
  message: string;
  count: number;
}

export interface FinanceReconciliationSummary {
  orderCount: number;
  orderAmount: number;
  invoicedAmount: number;
  paidAmount: number;
  uninvoicedAmount: number;
  outstandingAmount: number;
  fullyInvoicedCount: number;
  fullyPaidCount: number;
  warnings: FinanceReconciliationWarning[];
}

export async function getFinanceReconciliationSummary(
  prisma: InstanceType<typeof PrismaClient>,
): Promise<FinanceReconciliationSummary> {
  const orders = await prisma.order.findMany({
    select: {
      totalAmount: true,
      invoices: {
        select: {
          amount: true,
          payments: { select: { amount: true } },
        },
      },
    },
  });

  return buildFinanceReconciliationSummary(orders);
}

export function buildFinanceReconciliationSummary(
  orders: OrderForReconciliation[],
): FinanceReconciliationSummary {
  const rows = orders.map(toReconciliationRow);
  const uninvoicedOrders = rows.filter((row) => row.uninvoicedAmount > 0).length;
  const outstandingOrders = rows.filter((row) => row.outstandingAmount > 0).length;

  return {
    orderCount: rows.length,
    orderAmount: sumField(rows, 'orderAmount'),
    invoicedAmount: sumField(rows, 'invoicedAmount'),
    paidAmount: sumField(rows, 'paidAmount'),
    uninvoicedAmount: sumField(rows, 'uninvoicedAmount'),
    outstandingAmount: sumField(rows, 'outstandingAmount'),
    fullyInvoicedCount: rows.filter((row) => row.isFullyInvoiced).length,
    fullyPaidCount: rows.filter((row) => row.isFullyPaid).length,
    warnings: buildWarnings(uninvoicedOrders, outstandingOrders),
  };
}

function toReconciliationRow(order: OrderForReconciliation): ReconciliationRow {
  const orderAmount = toNumber(order.totalAmount);
  const invoicedAmount = sumAmounts(order.invoices);
  const paidAmount = order.invoices.reduce((sum, invoice) => sum + sumAmounts(invoice.payments), 0);

  return {
    orderAmount,
    invoicedAmount,
    paidAmount,
    uninvoicedAmount: Math.max(0, orderAmount - invoicedAmount),
    outstandingAmount: Math.max(0, orderAmount - paidAmount),
    isFullyInvoiced: invoicedAmount >= orderAmount,
    isFullyPaid: paidAmount >= orderAmount,
  };
}

function buildWarnings(
  uninvoicedOrders: number,
  outstandingOrders: number,
): FinanceReconciliationWarning[] {
  return [
    warning('UNINVOICED_ORDERS', uninvoicedOrders, 'Orders still have uninvoiced amounts.'),
    warning(
      'OUTSTANDING_ORDERS',
      outstandingOrders,
      'Orders still have outstanding payment amounts.',
    ),
  ].filter((item): item is FinanceReconciliationWarning => item !== null);
}

function warning(
  code: FinanceReconciliationWarning['code'],
  count: number,
  message: string,
): FinanceReconciliationWarning | null {
  return count > 0 ? { code, count, message } : null;
}

function sumField(
  items: ReconciliationRow[],
  field: keyof Pick<
    ReconciliationRow,
    'orderAmount' | 'invoicedAmount' | 'paidAmount' | 'uninvoicedAmount' | 'outstandingAmount'
  >,
): number {
  return items.reduce((sum, item) => sum + item[field], 0);
}

function toNumber(value: number | string | { toNumber(): number }): number {
  return typeof value === 'object' ? value.toNumber() : Number(value);
}
