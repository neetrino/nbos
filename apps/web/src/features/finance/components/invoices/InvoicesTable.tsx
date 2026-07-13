import { Building2, FileText } from 'lucide-react';
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
import type { Invoice } from '@/lib/api/finance';
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
  FinanceListMutedDash,
  FinanceListPrimaryCell,
  formatFinanceListDate,
} from '@/features/finance/components/shared/finance-list-table';

interface InvoicesTableProps {
  invoices: Invoice[];
  boardScope: BoardLifecycleScope;
  onInvoiceClick: (invoice: Invoice) => void;
}

export function InvoicesTable({ invoices, boardScope, onInvoiceClick }: InvoicesTableProps) {
  return (
    <div className={FINANCE_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Invoice</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Company</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Type</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Amount</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>
              {boardScope === 'CLOSED' ? 'Closed' : 'Status'}
            </TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Tax</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Due Date</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Paid Date</TableHead>
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
  const linkedCode = invoice.order?.deal?.code ?? invoice.order?.code ?? null;

  return (
    <TableRow className={FINANCE_LIST_ROW_HOVER_CLASS} onClick={() => onInvoiceClick(invoice)}>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <FinanceListPrimaryCell
          title={invoice.code}
          subtitle={linkedCode}
          subtitleIcon={FileText}
        />
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        {invoice.company?.name ? (
          <FinanceListIconLabel
            icon={Building2}
            iconClassName="bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
            label={invoice.company.name}
          />
        ) : (
          <FinanceListMutedDash />
        )}
      </TableCell>
      <TableCell className={`${FINANCE_LIST_CELL_CLASS} ${FINANCE_LIST_TYPE_CLASS}`}>
        {typeLabel}
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <FinanceListAmount amount={invoice.amount} currency={invoice.currency} />
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        {money ? (
          <StatusBadge
            label={money.label}
            variant={money.variant}
            className={FINANCE_LIST_BADGE_CLASS}
          />
        ) : null}
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <StatusBadge
          label={invoice.taxStatus === 'TAX' ? 'Tax' : 'Free'}
          variant={invoice.taxStatus === 'TAX' ? 'green' : 'gray'}
          className={FINANCE_LIST_BADGE_CLASS}
        />
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <FinanceListDate value={invoice.dueDate} overdueDays={resolveInvoiceOverdueDays(invoice)} />
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        {invoice.paidDate ? (
          <span className="text-xs">{formatFinanceListDate(invoice.paidDate)}</span>
        ) : (
          <FinanceListMutedDash />
        )}
      </TableCell>
    </TableRow>
  );
}
