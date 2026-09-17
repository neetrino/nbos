'use client';

import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared';
import type { Expense } from '@/lib/api/finance';

const INVOICE_STAGES = [
  'NEW',
  'AWAITING_PAYMENT',
  'OVERDUE',
  'ON_HOLD',
  'PAID',
  'CANCELLED',
] as const;

type InvoiceStage = (typeof INVOICE_STAGES)[number];

function isInvoiceStage(value: string): value is InvoiceStage {
  return (INVOICE_STAGES as readonly string[]).includes(value);
}

export function ExpenseSourceInvoiceStatus({ expense }: { expense: Expense }) {
  const t = useTranslations('expenses');
  const tInvoices = useTranslations('invoices');
  const invoice = expense.sourceInvoice;
  if (!invoice) return null;
  const statusLabel = isInvoiceStage(invoice.moneyStatus)
    ? tInvoices(`stage.${invoice.moneyStatus}`)
    : invoice.moneyStatus;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground">{t('fields.sourceInvoice')}</span>
      <span className="tabular-nums">{invoice.code}</span>
      <StatusBadge
        label={statusLabel}
        variant={invoice.moneyStatus === 'PAID' ? 'emerald' : 'amber'}
      />
    </div>
  );
}
