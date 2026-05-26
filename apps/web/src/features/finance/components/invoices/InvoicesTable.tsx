import { AlertTriangle, DollarSign } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import { formatAmount, getInvoiceMoneyStage } from '@/features/finance/constants/finance';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import { resolveInvoiceOverdueDays } from '@/features/finance/utils/invoice-overdue-days';
import { getInvoiceDealTitle, getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import type { Invoice } from '@/lib/api/finance';

interface InvoicesTableProps {
  invoices: Invoice[];
  boardScope: BoardLifecycleScope;
  onInvoiceClick: (invoice: Invoice) => void;
}

export function InvoicesTable({ invoices, boardScope, onInvoiceClick }: InvoicesTableProps) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>{boardScope === 'CLOSED' ? 'Closed' : 'Status'}</TableHead>
            <TableHead>Tax</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Paid Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <InvoiceTableRow key={invoice.id} invoice={invoice} onInvoiceClick={onInvoiceClick} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InvoiceTableRow({
  invoice,
  onInvoiceClick,
}: {
  invoice: Invoice;
  onInvoiceClick: (invoice: Invoice) => void;
}) {
  const money = getInvoiceMoneyStage(invoice.moneyStatus);

  return (
    <TableRow className="cursor-pointer" onClick={() => onInvoiceClick(invoice)}>
      <InvoiceCodeCell invoice={invoice} />
      <TableCell className="text-muted-foreground text-sm">
        {invoice.company?.name ?? '-'}
      </TableCell>
      <TableCell className="text-xs">{invoice.type}</TableCell>
      <InvoiceAmountCell amount={invoice.amount} />
      <TableCell>{money && <StatusBadge label={money.label} variant={money.variant} />}</TableCell>
      <InvoiceTaxCell taxStatus={invoice.taxStatus} />
      <InvoiceDueDateCell invoice={invoice} />
      <TableCell className="text-xs text-green-600">
        {invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : '-'}
      </TableCell>
    </TableRow>
  );
}

function InvoiceCodeCell({ invoice }: { invoice: Invoice }) {
  const dealTitle = getInvoiceDealTitle(invoice.order);
  const orderLabel = invoice.order
    ? dealTitle
      ? `Deal: ${dealTitle}`
      : `Order: ${getOrderDisplayTitle(invoice.order)}`
    : null;

  return (
    <TableCell>
      <div>
        <p className="font-medium">{invoice.code}</p>
        {orderLabel ? <p className="text-muted-foreground text-xs">{orderLabel}</p> : null}
      </div>
    </TableCell>
  );
}

function InvoiceAmountCell({ amount }: { amount: string }) {
  return (
    <TableCell className="text-right">
      <span className="flex items-center justify-end gap-1 font-semibold">
        <DollarSign size={12} className="text-accent" />
        {formatAmount(parseFloat(amount))}
      </span>
    </TableCell>
  );
}

function InvoiceTaxCell({ taxStatus }: { taxStatus: string }) {
  return (
    <TableCell>
      <StatusBadge
        label={taxStatus === 'TAX' ? 'Tax' : 'Free'}
        variant={taxStatus === 'TAX' ? 'green' : 'gray'}
      />
    </TableCell>
  );
}

function InvoiceDueDateCell({ invoice }: { invoice: Invoice }) {
  const overdueDays = resolveInvoiceOverdueDays(invoice);
  const dueLabel = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-';

  return (
    <TableCell className="text-xs">
      <div className={overdueDays > 0 ? 'font-medium text-red-500' : 'text-muted-foreground'}>
        {dueLabel}
      </div>
      {overdueDays > 0 ? (
        <div className="mt-0.5 flex items-center gap-1 text-xs font-medium text-red-500">
          <AlertTriangle size={10} aria-hidden />
          {overdueDays}d overdue
        </div>
      ) : null}
    </TableCell>
  );
}
