'use client';

import type { KeyboardEvent, ReactNode } from 'react';
import { AlertTriangle, Building2, Calendar, CheckCircle2, FolderKanban } from 'lucide-react';
import { KanbanCardShell, StatusBadge } from '@/components/shared';
import { formatAmount, getInvoiceTypeLabel } from '@/features/finance/constants/finance';
import { resolveInvoiceOverdueDays } from '@/features/finance/utils/invoice-overdue-days';
import { getInvoiceDisplayTitle } from '@/features/finance/utils/order-display';
import { parseMoneyAmount } from '@/lib/format/money';
import type { Invoice } from '@/lib/api/finance';
import { cn } from '@/lib/utils';

const COVERAGE_FULL_PERCENT = 100;

interface InvoiceKanbanCardProps {
  invoice: Invoice;
  onInvoiceClick: (invoice: Invoice) => void;
}

export function InvoiceKanbanCard({ invoice, onInvoiceClick }: InvoiceKanbanCardProps) {
  const typeLabel = getInvoiceTypeLabel(invoice.type);
  const title = getInvoiceDisplayTitle(invoice);
  const showCodeSubline = title !== invoice.code;
  const overdueDays = resolveInvoiceOverdueDays(invoice);
  const paidPercent = getInvoicePaidPercent(invoice);
  const amount = parseMoneyAmount(invoice.amount);
  const hasMeta = Boolean(invoice.company || invoice.project || invoice.dueDate);

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
        <div className="flex items-stretch gap-2.5">
          <span
            className={cn(
              'w-1 shrink-0 rounded-full bg-sky-400',
              showCodeSubline ? 'min-h-8' : 'h-3.5 self-center',
            )}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-foreground truncate text-sm leading-none font-bold">{title}</p>
              <StatusBadge
                label={typeLabel}
                variant="blue"
                className="shrink-0 rounded-full px-2.5 text-[10px] font-semibold tracking-wide"
              />
            </div>
            {showCodeSubline ? (
              <p className="text-muted-foreground mt-0.5 truncate text-xs">{invoice.code}</p>
            ) : null}
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
                  label="Tax"
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
            {invoice.dueDate ? (
              <MetaRow
                icon={<Calendar size={14} aria-hidden />}
                iconClassName="bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400"
                labelClassName="font-bold text-orange-500 dark:text-orange-400"
                label={formatInvoiceCardDueDate(invoice.dueDate)}
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
  labelClassName,
}: {
  icon: ReactNode;
  iconClassName: string;
  label: string;
  labelClassName?: string;
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
      <p className={cn('text-foreground/80 truncate text-xs', labelClassName)}>{label}</p>
    </div>
  );
}

function formatInvoiceCardDueDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
