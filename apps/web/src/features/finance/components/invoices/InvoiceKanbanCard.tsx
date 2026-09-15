'use client';

import type { KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { KanbanCardShell, StatusBadge } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { resolveInvoiceOverdueDays } from '@/features/finance/utils/invoice-overdue-days';
import type { InvoiceSourceCardChrome } from '@/features/finance/utils/invoice-source-card-chrome';
import { getInvoiceSourceCardChrome } from '@/features/finance/utils/invoice-source-card-chrome';
import {
  getInvoiceSourceLabel,
  resolveInvoiceSourceFamily,
} from '@/features/finance/utils/invoice-source-label';
import { invoiceSourceMessageKey } from './invoice-message-keys';
import { getInvoiceDisplayTitle } from '@/features/finance/utils/order-display';
import { parseMoneyAmount } from '@/lib/format/money';
import type { Invoice } from '@/lib/api/finance';
import { cn } from '@/lib/utils';
import { InvoiceKanbanCardMeta } from './InvoiceKanbanCardMeta';

const CARD_BADGE_CLASS = 'rounded-full px-2.5 text-[10px] font-semibold tracking-wide';
const CARD_SOURCE_LABEL_CLASS =
  'max-w-[42%] shrink-0 truncate text-[10px] font-semibold leading-none';
const CARD_ACCENT_BAR_CLASS = 'h-3.5 w-1 shrink-0 rounded-full';
const COVERAGE_FULL_PERCENT = 100;
const COVERAGE_TONE_CLASS = {
  blue: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
} as const;

const CARD_BUTTON_CLASS =
  'cursor-pointer space-y-2 rounded-xl p-3 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none';

interface InvoiceKanbanCardProps {
  invoice: Invoice;
  onInvoiceClick: (invoice: Invoice) => void;
}

interface InvoiceKanbanCardBodyProps {
  invoice: Invoice;
  title: string;
  sourceLabel: string;
  chrome: InvoiceSourceCardChrome;
  taxLabel: string;
  paidLabel: string;
  overdueLabel: string;
  onInvoiceClick: (invoice: Invoice) => void;
}

export function InvoiceKanbanCard({ invoice, onInvoiceClick }: InvoiceKanbanCardProps) {
  const t = useTranslations('invoices');
  const sourceKey = invoiceSourceMessageKey(invoice);
  const sourceLabel = sourceKey ? t(sourceKey) : getInvoiceSourceLabel(invoice);
  const chrome = getInvoiceSourceCardChrome(resolveInvoiceSourceFamily(invoice));
  const title = getInvoiceDisplayTitle(invoice);

  return (
    <KanbanCardShell
      as="article"
      preset="crm"
      radius="xl"
      padding="none"
      baseShadow="sm"
      hoverShadow="md"
      shellClassName={chrome.cardShellClassName}
    >
      <InvoiceKanbanCardBody
        invoice={invoice}
        title={title}
        sourceLabel={sourceLabel}
        chrome={chrome}
        taxLabel={t('card.tax')}
        paidLabel={t('card.paid')}
        overdueLabel={t('card.overdue')}
        onInvoiceClick={onInvoiceClick}
      />
    </KanbanCardShell>
  );
}

function InvoiceKanbanCardBody({
  invoice,
  title,
  sourceLabel,
  chrome,
  taxLabel,
  paidLabel,
  overdueLabel,
  onInvoiceClick,
}: InvoiceKanbanCardBodyProps) {
  const overdueDays = resolveInvoiceOverdueDays(invoice);
  const paidPercent = resolveInvoiceCardPartialPaidPercent(invoice);
  const amount = parseMoneyAmount(invoice.amount);
  const hasMeta = Boolean(invoice.company || invoice.project || invoice.dueDate);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${title} ${invoice.code} ${sourceLabel}`}
      className={CARD_BUTTON_CLASS}
      onClick={() => onInvoiceClick(invoice)}
      onKeyDown={(event) => handleCardKeyDown(event, invoice, onInvoiceClick)}
    >
      <InvoiceCardHeader
        title={title}
        sourceLabel={sourceLabel}
        accentBarClassName={chrome.accentBarClassName}
        sourceLabelClassName={chrome.sourceLabelClassName}
      />
      <InvoiceCardAmountRow
        amountLabel={formatAmount(amount, invoice.currency)}
        paidPercent={paidPercent}
        showTax={invoice.taxStatus === 'TAX'}
        taxLabel={taxLabel}
        paidLabel={paidLabel}
      />
      {hasMeta ? (
        <InvoiceKanbanCardMeta
          companyName={invoice.company?.name}
          projectName={invoice.project?.name}
          dueDate={invoice.dueDate}
          overdue={overdueDays > 0}
          overdueLabel={overdueLabel}
        />
      ) : null}
    </div>
  );
}

function InvoiceCardHeader({
  title,
  sourceLabel,
  accentBarClassName,
  sourceLabelClassName,
}: {
  title: string;
  sourceLabel: string;
  accentBarClassName: string;
  sourceLabelClassName: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn(CARD_ACCENT_BAR_CLASS, accentBarClassName)} aria-hidden />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <p className="text-foreground truncate text-sm leading-none font-bold">{title}</p>
        <span className={cn(CARD_SOURCE_LABEL_CLASS, sourceLabelClassName)}>{sourceLabel}</span>
      </div>
    </div>
  );
}

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
          <StatusBadge
            label={taxLabel}
            variant="green"
            className={cn('shrink-0', CARD_BADGE_CLASS)}
          />
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
