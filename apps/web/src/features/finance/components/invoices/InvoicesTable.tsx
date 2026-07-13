import { AlertTriangle, Building2, Calendar, DollarSign, FileText } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import { getInvoiceMoneyStage } from '@/features/finance/constants/finance';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import { resolveInvoiceOverdueDays } from '@/features/finance/utils/invoice-overdue-days';
import { formatGroupedNumber, parseMoneyAmount, AMD_CURRENCY_SYMBOL } from '@/lib/format/money';
import type { Invoice } from '@/lib/api/finance';

const LIST_DATE_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

interface InvoicesTableProps {
  invoices: Invoice[];
  boardScope: BoardLifecycleScope;
  onInvoiceClick: (invoice: Invoice) => void;
}

export function InvoicesTable({ invoices, boardScope, onInvoiceClick }: InvoicesTableProps) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4">Invoice</TableHead>
            <TableHead className="px-4">Company</TableHead>
            <TableHead className="px-4">Type</TableHead>
            <TableHead className="px-4">Amount</TableHead>
            <TableHead className="px-4">{boardScope === 'CLOSED' ? 'Closed' : 'Status'}</TableHead>
            <TableHead className="px-4">Tax</TableHead>
            <TableHead className="px-4">Due Date</TableHead>
            <TableHead className="px-4">Paid Date</TableHead>
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
  const typeLabel = invoice.type.replace(/_/g, ' ').toUpperCase();

  return (
    <TableRow className="hover:bg-muted/40" onClick={() => onInvoiceClick(invoice)}>
      <InvoiceCodeCell invoice={invoice} />
      <TableCell className="px-4 py-3">
        {invoice.company?.name ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
              <Building2 size={13} aria-hidden />
            </span>
            <span className="truncate text-sm">{invoice.company.name}</span>
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground px-4 py-3 text-xs font-medium tracking-wide">
        {typeLabel}
      </TableCell>
      <InvoiceAmountCell amount={invoice.amount} currency={invoice.currency} />
      <TableCell className="px-4 py-3">
        {money ? (
          <StatusBadge
            label={money.label}
            variant={money.variant}
            className="rounded-full px-2.5 text-[11px]"
          />
        ) : null}
      </TableCell>
      <InvoiceTaxCell taxStatus={invoice.taxStatus} />
      <InvoiceDueDateCell invoice={invoice} />
      <TableCell className="text-muted-foreground px-4 py-3 text-xs">
        {invoice.paidDate ? formatListDate(invoice.paidDate) : '—'}
      </TableCell>
    </TableRow>
  );
}

function InvoiceCodeCell({ invoice }: { invoice: Invoice }) {
  const linkedCode = invoice.order?.deal?.code ?? invoice.order?.code ?? null;

  return (
    <TableCell className="px-4 py-3">
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-bold">{invoice.code}</p>
        {linkedCode ? (
          <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
            <FileText size={12} className="shrink-0" aria-hidden />
            <span className="truncate">{linkedCode}</span>
          </div>
        ) : null}
      </div>
    </TableCell>
  );
}

function InvoiceAmountCell({ amount, currency }: { amount: string; currency: string }) {
  const value = parseMoneyAmount(amount);
  const currencyLabel = currency === 'AMD' ? AMD_CURRENCY_SYMBOL : currency;

  return (
    <TableCell className="px-4 py-3">
      <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums">
        <DollarSign size={14} className="shrink-0 text-sky-500" aria-hidden />
        <span>{formatGroupedNumber(value)}</span>
        <span className="text-foreground/80 font-medium">{currencyLabel}</span>
      </span>
    </TableCell>
  );
}

function InvoiceTaxCell({ taxStatus }: { taxStatus: string }) {
  return (
    <TableCell className="px-4 py-3">
      <StatusBadge
        label={taxStatus === 'TAX' ? 'Tax' : 'Free'}
        variant={taxStatus === 'TAX' ? 'green' : 'gray'}
        className="rounded-full px-2.5 text-[11px]"
      />
    </TableCell>
  );
}

function InvoiceDueDateCell({ invoice }: { invoice: Invoice }) {
  const overdueDays = resolveInvoiceOverdueDays(invoice);

  return (
    <TableCell className="px-4 py-3">
      {invoice.dueDate ? (
        <div className="space-y-1">
          <div className="text-foreground flex items-center gap-1.5 text-xs">
            <Calendar size={12} className="text-muted-foreground shrink-0" aria-hidden />
            <span>{formatListDate(invoice.dueDate)}</span>
          </div>
          {overdueDays > 0 ? (
            <div className="flex items-center gap-1 text-xs font-medium text-red-500">
              <AlertTriangle size={11} className="shrink-0" aria-hidden />
              {overdueDays}d overdue
            </div>
          ) : null}
        </div>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      )}
    </TableCell>
  );
}

function formatListDate(value: string): string {
  return LIST_DATE_FORMATTER.format(new Date(value));
}
