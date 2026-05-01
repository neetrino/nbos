import { DollarSign } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import { formatAmount, getInvoiceStage } from '@/features/finance/constants/finance';
import type { Invoice } from '@/lib/api/finance';

interface InvoicesTableProps {
  invoices: Invoice[];
  onInvoiceClick: (invoice: Invoice) => void;
}

export function InvoicesTable({ invoices, onInvoiceClick }: InvoicesTableProps) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
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
  const stage = getInvoiceStage(invoice.status);

  return (
    <TableRow className="cursor-pointer" onClick={() => onInvoiceClick(invoice)}>
      <InvoiceCodeCell invoice={invoice} />
      <TableCell className="text-muted-foreground text-sm">
        {invoice.company?.name ?? '-'}
      </TableCell>
      <TableCell className="text-xs">{invoice.type}</TableCell>
      <InvoiceAmountCell amount={invoice.amount} />
      <TableCell>{stage && <StatusBadge label={stage.label} variant={stage.variant} />}</TableCell>
      <InvoiceTaxCell taxStatus={invoice.taxStatus} />
      <InvoiceDueDateCell invoice={invoice} />
      <TableCell className="text-xs text-green-600">
        {invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : '-'}
      </TableCell>
    </TableRow>
  );
}

function InvoiceCodeCell({ invoice }: { invoice: Invoice }) {
  return (
    <TableCell>
      <div>
        <p className="font-medium">{invoice.code}</p>
        {invoice.order && (
          <p className="text-muted-foreground text-xs">Order: {invoice.order.code}</p>
        )}
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
  const isOverdue =
    invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID';

  return (
    <TableCell
      className={`text-xs ${isOverdue ? 'font-medium text-red-500' : 'text-muted-foreground'}`}
    >
      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
    </TableCell>
  );
}
