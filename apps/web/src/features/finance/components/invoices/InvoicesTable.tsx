'use client';

import { Building2, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
import { getInvoiceSourceLabel } from '@/features/finance/utils/invoice-source-label';
import {
  INVOICE_STAGE_MESSAGE_KEYS,
  INVOICE_TAX_MESSAGE_KEYS,
  invoiceSourceMessageKey,
} from './invoice-message-keys';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import { resolveInvoiceOverdueDays } from '@/features/finance/utils/invoice-overdue-days';
import { getInvoiceDisplayTitle } from '@/features/finance/utils/order-display';
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
  const t = useTranslations('invoices');
  return (
    <div className={FINANCE_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>{t('table.invoice')}</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>{t('table.company')}</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>{t('table.type')}</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>{t('table.amount')}</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>
              {boardScope === 'CLOSED' ? t('table.closed') : t('table.status')}
            </TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>{t('table.tax')}</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>{t('table.dueDate')}</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>{t('table.paidDate')}</TableHead>
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
  const t = useTranslations('invoices');
  const money = getInvoiceMoneyStage(invoice.moneyStatus);
  const sourceKey = invoiceSourceMessageKey(invoice);
  const sourceLabel = sourceKey ? t(sourceKey) : getInvoiceSourceLabel(invoice);
  const title = getInvoiceDisplayTitle(invoice);
  const moneyLabel = money ? t(INVOICE_STAGE_MESSAGE_KEYS[money.value]) : null;
  const taxKey =
    invoice.taxStatus === 'TAX' ? INVOICE_TAX_MESSAGE_KEYS.TAX : INVOICE_TAX_MESSAGE_KEYS.TAX_FREE;

  return (
    <TableRow className={FINANCE_LIST_ROW_HOVER_CLASS} onClick={() => onInvoiceClick(invoice)}>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <FinanceListPrimaryCell title={title} subtitle={invoice.code} subtitleIcon={FileText} />
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
        {sourceLabel}
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <FinanceListAmount amount={invoice.amount} currency={invoice.currency} />
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        {money && moneyLabel ? (
          <StatusBadge
            label={moneyLabel}
            variant={money.variant}
            className={FINANCE_LIST_BADGE_CLASS}
          />
        ) : null}
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <StatusBadge
          label={t(taxKey)}
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
