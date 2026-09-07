'use client';

import type { KeyboardEvent, ReactNode } from 'react';
import { Building2, CheckCircle2, FolderKanban, type LucideIcon } from 'lucide-react';
import { KanbanCardShell, StatusBadge } from '@/components/shared';
import { formatEntityListDate, resolveEntityCardDateParts } from '@/components/shared/entity-list-date';
import { formatAmount } from '@/features/finance/constants/finance';
import { resolveInvoiceOverdueDays } from '@/features/finance/utils/invoice-overdue-days';
import { getInvoiceSourceLabel } from '@/features/finance/utils/invoice-source-label';
import { getInvoiceDisplayTitle } from '@/features/finance/utils/order-display';
import { parseMoneyAmount } from '@/lib/format/money';
import type { Invoice } from '@/lib/api/finance';
import { cn } from '@/lib/utils';

const COVERAGE_FULL_PERCENT = 100;
const CARD_DATE_DAY_MONTH_CLASS = 'text-base leading-none font-bold tabular-nums';
const CARD_DATE_YEAR_CLASS = 'mt-0.5 text-[10px] leading-tight';
const CARD_DATE_DUE_TONE_CLASS = 'text-orange-500 dark:text-orange-400';
const CARD_DATE_DUE_YEAR_TONE_CLASS = 'text-orange-500/70 dark:text-orange-400/70';
const CARD_DATE_OVERDUE_TONE_CLASS = 'text-red-600 dark:text-red-400';
const CARD_DATE_OVERDUE_YEAR_TONE_CLASS = 'text-red-600/70 dark:text-red-400/70';
const CARD_DATE_OVERDUE_LABEL = 'overdue';

const INVOICE_CARD_RELATION_VISUAL: Record<
  'company' | 'project',
  { icon: LucideIcon; iconClassName: string }
> = {
  company: {
    icon: Building2,
    iconClassName: 'bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400',
  },
  project: {
    icon: FolderKanban,
    iconClassName: 'bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400',
  },
};

interface InvoiceKanbanCardProps {
  invoice: Invoice;
  onInvoiceClick: (invoice: Invoice) => void;
}

export function InvoiceKanbanCard({ invoice, onInvoiceClick }: InvoiceKanbanCardProps) {
  const sourceLabel = getInvoiceSourceLabel(invoice);
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
                label={sourceLabel}
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
          {paidPercent !== null || invoice.taxStatus === 'TAX' ? (
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
            </div>
          ) : null}
        </div>

        {hasMeta ? (
          <InvoiceCardMeta
            companyName={invoice.company?.name}
            projectName={invoice.project?.name}
            dueDate={invoice.dueDate}
            overdue={overdueDays > 0}
          />
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

function InvoiceCardMeta({
  companyName,
  projectName,
  dueDate,
  overdue,
}: {
  companyName?: string;
  projectName?: string;
  dueDate?: string | null;
  overdue: boolean;
}) {
  const relation = resolveInvoiceCardRelation(companyName, projectName);

  return (
    <div
      className={cn(
        'border-border flex gap-3 border-t pt-3',
        relation ? 'items-center justify-between' : 'justify-end',
      )}
    >
      {relation ? (
        <div className="min-w-0 flex-1">
          <InvoiceCardRelationRow relation={relation} />
        </div>
      ) : null}
      {dueDate ? <InvoiceCardDueDate value={dueDate} overdue={overdue} /> : null}
    </div>
  );
}

type InvoiceCardRelation = { kind: 'company' | 'project'; label: string };

function resolveInvoiceCardRelation(
  companyName?: string,
  projectName?: string,
): InvoiceCardRelation | null {
  if (companyName) return { kind: 'company', label: companyName };
  if (projectName) return { kind: 'project', label: projectName };
  return null;
}

function InvoiceCardRelationRow({ relation }: { relation: InvoiceCardRelation }) {
  const visual = INVOICE_CARD_RELATION_VISUAL[relation.kind];
  const Icon = visual.icon;
  return (
    <MetaRow
      icon={<Icon size={14} aria-hidden />}
      iconClassName={visual.iconClassName}
      label={relation.label}
    />
  );
}

function InvoiceCardDueDate({ value, overdue }: { value: string; overdue: boolean }) {
  const parts = resolveEntityCardDateParts(value);
  if (!parts) return null;

  const formatted = formatEntityListDate(value) || parts.dayMonth;
  const label = overdue ? `${formatted} ${CARD_DATE_OVERDUE_LABEL}` : formatted;

  return (
    <time dateTime={value} aria-label={label} className="shrink-0 text-right">
      <p
        className={cn(
          CARD_DATE_DAY_MONTH_CLASS,
          overdue ? CARD_DATE_OVERDUE_TONE_CLASS : CARD_DATE_DUE_TONE_CLASS,
        )}
      >
        {parts.dayMonth}
      </p>
      <p
        className={cn(
          CARD_DATE_YEAR_CLASS,
          overdue ? CARD_DATE_OVERDUE_YEAR_TONE_CLASS : CARD_DATE_DUE_YEAR_TONE_CLASS,
        )}
      >
        {parts.year}
      </p>
    </time>
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
