'use client';

import type { KeyboardEvent, ReactNode } from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  FolderKanban,
  Handshake,
} from 'lucide-react';
import { KanbanCardShell, StatusBadge } from '@/components/shared';
import { formatAmount, INVOICE_TYPES } from '@/features/finance/constants/finance';
import { resolveInvoiceOverdueDays } from '@/features/finance/utils/invoice-overdue-days';
import { getInvoiceDealTitle } from '@/features/finance/utils/order-display';
import { parseMoneyAmount } from '@/lib/format/money';
import type { Invoice } from '@/lib/api/finance';
import { cn } from '@/lib/utils';

const COVERAGE_FULL_PERCENT = 100;

interface InvoiceKanbanCardProps {
  invoice: Invoice;
  onInvoiceClick: (invoice: Invoice) => void;
}

export function InvoiceKanbanCard({ invoice, onInvoiceClick }: InvoiceKanbanCardProps) {
  const type = INVOICE_TYPES.find((invoiceType) => invoiceType.value === invoice.type);
  const typeLabel = (type?.label ?? invoice.type.replace(/_/g, ' ')).toUpperCase();
  const dealTitle = getInvoiceDealTitle(invoice.order);
  const overdueDays = resolveInvoiceOverdueDays(invoice);
  const paidPercent = getInvoicePaidPercent(invoice);
  const amount = parseMoneyAmount(invoice.amount);
  const hasMeta = Boolean(dealTitle || invoice.company || invoice.project || invoice.dueDate);

  return (
    <KanbanCardShell as="article" radius="xl" padding="none" baseShadow="sm" hoverShadow="md">
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'cursor-pointer space-y-3 rounded-xl p-4',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        )}
        onClick={() => onInvoiceClick(invoice)}
        onKeyDown={(event) => handleCardKeyDown(event, invoice, onInvoiceClick)}
      >
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="h-3.5 w-1 shrink-0 rounded-full bg-sky-400" aria-hidden />
              <p className="text-foreground truncate text-sm leading-none font-bold">
                {invoice.code}
              </p>
            </div>
            <StatusBadge
              label={typeLabel}
              variant="blue"
              className="shrink-0 rounded-full px-2.5 text-[10px] font-semibold tracking-wide"
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-foreground text-xl leading-none font-bold tabular-nums">
            {formatAmount(amount, invoice.currency)}
          </p>
          {paidPercent !== null || invoice.taxStatus === 'TAX' || overdueDays > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {paidPercent !== null ? (
                <CoveragePill label="Paid" percent={paidPercent} tone="blue" />
              ) : null}
              {invoice.taxStatus === 'TAX' ? (
                <StatusBadge
                  label="TAX"
                  variant="green"
                  className="rounded-full px-2.5 text-[10px] font-semibold tracking-wide"
                />
              ) : null}
              {overdueDays > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  <AlertTriangle size={11} className="shrink-0" aria-hidden />
                  {overdueDays}d overdue
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {hasMeta ? (
          <div className="border-border flex flex-col gap-2.5 border-t pt-3">
            {dealTitle ? (
              <MetaRow
                icon={<Handshake size={14} aria-hidden />}
                iconClassName="bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                label={dealTitle}
              />
            ) : null}
            {invoice.company ? (
              <MetaRow
                icon={<Building2 size={14} aria-hidden />}
                iconClassName="bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
                label={invoice.company.name}
              />
            ) : null}
            {invoice.project ? (
              <MetaRow
                icon={<FolderKanban size={14} aria-hidden />}
                iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
                label={invoice.project.name}
              />
            ) : null}
            {invoice.dueDate ? (
              <MetaRow
                icon={<Calendar size={14} aria-hidden />}
                iconClassName="bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300"
                label={new Date(invoice.dueDate).toLocaleDateString()}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </KanbanCardShell>
  );
}

const COVERAGE_TONE_CLASS = {
  blue: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
} as const;

function CoveragePill({
  label,
  percent,
  tone,
}: {
  label: string;
  percent: number;
  tone: keyof typeof COVERAGE_TONE_CLASS;
}) {
  const isComplete = percent >= COVERAGE_FULL_PERCENT;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums',
        COVERAGE_TONE_CLASS[tone],
      )}
    >
      {isComplete ? <CheckCircle2 size={11} className="shrink-0" aria-hidden /> : null}
      {label} {percent}%
    </span>
  );
}

function MetaRow({
  icon,
  iconClassName,
  label,
}: {
  icon: ReactNode;
  iconClassName: string;
  label: string;
}) {
  return (
    <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-x-2.5">
      <span
        className={cn(
          'flex size-7 items-center justify-center justify-self-start rounded-lg',
          iconClassName,
        )}
      >
        {icon}
      </span>
      <p className="text-foreground/80 truncate text-xs">{label}</p>
    </div>
  );
}

function getInvoicePaidPercent(invoice: Invoice): number | null {
  const total = parseMoneyAmount(invoice.amount);
  if (total <= 0) return null;

  const paid = invoice.paymentCoverage?.paidAmount;
  if (paid == null) return null;

  return Math.min(COVERAGE_FULL_PERCENT, Math.round((paid / total) * 100));
}

function handleCardKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  invoice: Invoice,
  onInvoiceClick: (invoice: Invoice) => void,
): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onInvoiceClick(invoice);
}
