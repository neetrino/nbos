'use client';

import type { KeyboardEvent, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, FolderKanban, type LucideIcon } from 'lucide-react';
import { KanbanCardShell, StatusBadge } from '@/components/shared';
import {
  formatEntityListDate,
  resolveEntityCardDateParts,
} from '@/components/shared/entity-list-date';
import { formatAmount } from '@/features/finance/constants/finance';
import { resolveInvoiceOverdueDays } from '@/features/finance/utils/invoice-overdue-days';
import { getInvoiceSourceLabel } from '@/features/finance/utils/invoice-source-label';
import { invoiceSourceMessageKey } from './invoice-message-keys';
import { getInvoiceDisplayTitle } from '@/features/finance/utils/order-display';
import { parseMoneyAmount } from '@/lib/format/money';
import type { Invoice } from '@/lib/api/finance';
import { cn } from '@/lib/utils';

const COVERAGE_FULL_PERCENT = 100;
const CARD_BADGE_CLASS = 'rounded-full px-2.5 text-[10px] font-semibold tracking-wide';
const CARD_DATE_CLASS = {
  dayMonth: 'text-base leading-none font-bold tabular-nums',
  year: 'mt-0.5 text-[10px] leading-tight',
  due: 'text-orange-500 dark:text-orange-400',
  dueYear: 'text-orange-500/70 dark:text-orange-400/70',
  overdue: 'text-red-600 dark:text-red-400',
  overdueYear: 'text-red-600/70 dark:text-red-400/70',
} as const;
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
  const t = useTranslations('invoices');
  const sourceKey = invoiceSourceMessageKey(invoice);
  const sourceLabel = sourceKey ? t(sourceKey) : getInvoiceSourceLabel(invoice);
  const title = getInvoiceDisplayTitle(invoice);
  const overdueDays = resolveInvoiceOverdueDays(invoice);
  const paidPercent = resolveInvoiceCardPartialPaidPercent(invoice);
  const amount = parseMoneyAmount(invoice.amount);
  const hasMeta = Boolean(invoice.company || invoice.project || invoice.dueDate);

  return (
    <KanbanCardShell as="article" radius="xl" padding="none" baseShadow="sm" hoverShadow="md">
      <div
        role="button"
        tabIndex={0}
        aria-label={`${title} ${invoice.code}`}
        className={cn(
          'cursor-pointer space-y-2 rounded-xl p-3',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        )}
        onClick={() => onInvoiceClick(invoice)}
        onKeyDown={(event) => handleCardKeyDown(event, invoice, onInvoiceClick)}
      >
        <div className="flex items-center gap-2.5">
          <span className="h-3.5 w-1 shrink-0 rounded-full bg-sky-400" aria-hidden />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <p className="text-foreground truncate text-sm leading-none font-bold">{title}</p>
            <StatusBadge
              label={sourceLabel}
              variant="blue"
              className={cn('shrink-0', CARD_BADGE_CLASS)}
            />
          </div>
        </div>

        <InvoiceCardAmountRow
          amountLabel={formatAmount(amount, invoice.currency)}
          paidPercent={paidPercent}
          showTax={invoice.taxStatus === 'TAX'}
          taxLabel={t('card.tax')}
          paidLabel={t('card.paid')}
        />

        {hasMeta ? (
          <InvoiceCardMeta
            companyName={invoice.company?.name}
            projectName={invoice.project?.name}
            dueDate={invoice.dueDate}
            overdue={overdueDays > 0}
            overdueLabel={t('card.overdue')}
          />
        ) : null}
      </div>
    </KanbanCardShell>
  );
}

const COVERAGE_TONE_CLASS = {
  blue: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
} as const;

function InvoiceCardAmountRow({
  amountLabel,
  paidPercent,
  showTax,
  taxLabel,
  paidLabel,
}: {
  amountLabel: string;
  paidPercent: number | null;
  showTax: boolean;
  taxLabel: string;
  paidLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="text-foreground truncate text-xl leading-none font-bold tabular-nums">
          {amountLabel}
        </p>
        {showTax ? (
          <StatusBadge label={taxLabel} variant="green" className={cn('shrink-0', CARD_BADGE_CLASS)} />
        ) : null}
      </div>
      {paidPercent !== null ? (
        <CoveragePill label={paidLabel} percent={paidPercent} tone="blue" />
      ) : null}
    </div>
  );
}

function CoveragePill({
  label,
  percent,
  tone,
}: {
  label: string;
  percent: number;
  tone: keyof typeof COVERAGE_TONE_CLASS;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums',
        COVERAGE_TONE_CLASS[tone],
      )}
    >
      {label} {percent}%
    </span>
  );
}

function InvoiceCardMeta({
  companyName,
  projectName,
  dueDate,
  overdue,
  overdueLabel,
}: {
  companyName?: string;
  projectName?: string;
  dueDate?: string | null;
  overdue: boolean;
  overdueLabel: string;
}) {
  const relation = resolveInvoiceCardRelation(companyName, projectName);

  return (
    <div
      className={cn(
        'border-border flex gap-3 border-t pt-2',
        relation ? 'items-center justify-between' : 'justify-end',
      )}
    >
      {relation ? (
        <div className="min-w-0 flex-1">
          <InvoiceCardRelationRow relation={relation} />
        </div>
      ) : null}
      {dueDate ? (
        <InvoiceCardDueDate value={dueDate} overdue={overdue} overdueLabel={overdueLabel} />
      ) : null}
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

function InvoiceCardDueDate({
  value,
  overdue,
  overdueLabel,
}: {
  value: string;
  overdue: boolean;
  overdueLabel: string;
}) {
  const parts = resolveEntityCardDateParts(value);
  if (!parts) return null;

  const formatted = formatEntityListDate(value) || parts.dayMonth;
  const label = overdue ? `${formatted} ${overdueLabel}` : formatted;

  return (
    <time dateTime={value} aria-label={label} className="shrink-0 text-right">
      <p
        className={cn(
          CARD_DATE_CLASS.dayMonth,
          overdue ? CARD_DATE_CLASS.overdue : CARD_DATE_CLASS.due,
        )}
      >
        {parts.dayMonth}
      </p>
      <p
        className={cn(
          CARD_DATE_CLASS.year,
          overdue ? CARD_DATE_CLASS.overdueYear : CARD_DATE_CLASS.dueYear,
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

function resolveInvoiceCardPartialPaidPercent(invoice: Invoice): number | null {
  const percent = getInvoicePaidPercent(invoice);
  if (percent == null || percent <= 0 || percent >= COVERAGE_FULL_PERCENT) return null;
  return percent;
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
