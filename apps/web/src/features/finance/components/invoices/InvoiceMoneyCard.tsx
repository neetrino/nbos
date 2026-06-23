'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Calendar, Clock, FileCheck, Wallet } from 'lucide-react';
import {
  AmdCurrencyIcon,
  DETAIL_SHEET_SECTION_SURFACE_CLASS,
  InlineField,
} from '@/components/shared';
import { formatAmount, INVOICE_TAX_STATUS_OPTIONS } from '@/features/finance/constants/finance';
import { invoiceStageGateSectionClass } from '@/features/finance/constants/invoice-stage-gate-highlight';
import { INVOICE_GATE_FIELD_PAYMENTS } from '@/features/finance/constants/invoice-money-status-gate-client';
import { cn } from '@/lib/utils';
import type { InvoiceSheetInvoice } from './InvoiceSheetSections';

const MONEY_METRIC_DIVIDER_CLASS = 'border-stone-100 dark:border-stone-800';

interface InvoiceMoneyCardProps {
  invoice: InvoiceSheetInvoice;
  gateRequiredFields?: ReadonlySet<string>;
  billingFields?: ReactNode;
}

export function InvoiceMoneyCard({
  invoice,
  gateRequiredFields = new Set(),
  billingFields = null,
}: InvoiceMoneyCardProps) {
  const coverage = invoice.paymentCoverage;
  const outstanding = coverage?.outstandingAmount ?? parseFloat(invoice.amount);
  const isOverdue = isInvoiceOverdue(invoice);
  const taxLabel =
    INVOICE_TAX_STATUS_OPTIONS.find((option) => option.value === invoice.taxStatus)?.label ??
    invoice.taxStatus;

  return (
    <section
      className={invoiceStageGateSectionClass(
        gateRequiredFields,
        INVOICE_GATE_FIELD_PAYMENTS,
        DETAIL_SHEET_SECTION_SURFACE_CLASS,
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
          <Wallet size={18} aria-hidden />
        </div>
        <h3 className="text-base font-semibold tracking-tight">Money</h3>
      </div>

      {billingFields ?? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InlineField
            variant="controlled"
            label="Amount"
            type="money"
            value={invoice.amount}
            icon={<AmdCurrencyIcon className="text-muted-foreground/70" />}
            disabled
            onValueChange={() => undefined}
          />
          <InlineField
            variant="controlled"
            label="Tax Status"
            type="text"
            value={taxLabel}
            disabled
            onValueChange={() => undefined}
          />
        </div>
      )}

      <div className={cn('mt-4 border-t pt-4', MONEY_METRIC_DIVIDER_CLASS)}>
        <div
          className={cn(
            'grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0',
            MONEY_METRIC_DIVIDER_CLASS,
          )}
        >
          <InvoiceMoneyMetric
            icon={FileCheck}
            iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
            label="Outstanding"
            value={formatAmount(outstanding, invoice.currency)}
            valueClassName="text-emerald-600 dark:text-emerald-400"
          />
          <InvoiceMoneyMetric
            icon={Wallet}
            iconClassName="bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300"
            label="Paid"
            value={formatAmount(coverage?.paidAmount ?? 0, invoice.currency)}
          />
          <InvoiceMoneyMetric
            icon={Calendar}
            iconClassName="bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300"
            label="Due"
            value={invoice.dueDate ? formatShortDate(invoice.dueDate) : '—'}
            valueClassName={
              isOverdue && invoice.dueDate ? 'text-red-600 dark:text-red-400' : undefined
            }
          />
        </div>
      </div>

      <div className={cn('mt-4 border-t pt-4', MONEY_METRIC_DIVIDER_CLASS)}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <InvoiceMoneyMetaDate label="Created" value={formatShortDate(invoice.createdAt)} />
          {invoice.paidDate ? (
            <InvoiceMoneyMetaDate label="Paid on" value={formatShortDate(invoice.paidDate)} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function InvoiceMoneyMetaDate({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <span className="text-muted-foreground/70 flex size-6 shrink-0 items-center justify-center">
        <Clock size={14} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
        <span className="border-border bg-muted/20 text-foreground rounded-lg border px-2.5 py-1 text-sm tabular-nums">
          {value}
        </span>
      </div>
    </div>
  );
}

function InvoiceMoneyMetric({
  icon: Icon,
  iconClassName,
  label,
  value,
  valueClassName,
}: {
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center px-3 py-2 text-center sm:py-0">
      <div className={cn('flex size-10 items-center justify-center rounded-full', iconClassName)}>
        <Icon size={18} aria-hidden />
      </div>
      <p className="text-muted-foreground mt-2 text-[11px] font-semibold tracking-widest uppercase">
        {label}
      </p>
      <p className={cn('mt-1 text-sm font-bold tabular-nums', valueClassName ?? 'text-foreground')}>
        {value}
      </p>
    </div>
  );
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isInvoiceOverdue(invoice: InvoiceSheetInvoice) {
  return (
    invoice.moneyStatus === 'OVERDUE' ||
    Boolean(
      invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.moneyStatus !== 'PAID',
    )
  );
}
