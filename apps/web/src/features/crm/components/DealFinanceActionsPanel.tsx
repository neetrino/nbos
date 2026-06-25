'use client';

import { TrendingUp } from 'lucide-react';
import { AmdCurrencyIcon, DETAIL_SHEET_SECTION_TITLE_CLASS } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { Deal } from '@/lib/api/deals';
import { formatAmount } from '../constants/dealPipeline';
import { computeFinance } from './deal-general-tab.helpers';
import { DealOrderCommercialBadges } from './DealOrderCommercialBadges';

const FINANCE_PANEL_SURFACE_CLASS =
  'rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-5 dark:border-emerald-800 dark:from-emerald-950/20 dark:to-transparent';

const FINANCE_VALUE_TOTAL_CLASS = 'font-bold text-emerald-600 dark:text-emerald-400';
const FINANCE_VALUE_PARTNER_CLASS = 'font-bold text-orange-500 dark:text-orange-400';
const FINANCE_VALUE_REVENUE_CLASS = 'font-bold text-sky-600 dark:text-sky-400';
const FINANCE_VALUE_TO_RECEIVE_DUE_CLASS = 'font-bold text-amber-600 dark:text-amber-400';
const FINANCE_VALUE_TO_RECEIVE_CLEAR_CLASS = 'font-bold text-emerald-600 dark:text-emerald-400';

interface DealFinanceActionsPanelProps {
  deal: Deal;
  firstOrder: Deal['orders'][number] | undefined;
}

export function DealFinanceActionsPanel({ deal, firstOrder }: DealFinanceActionsPanelProps) {
  const finance = computeFinance(deal);

  return (
    <section className={FINANCE_PANEL_SURFACE_CLASS}>
      <h4 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>
        <TrendingUp size={12} />
        Finance
      </h4>
      {firstOrder ? <DealOrderCommercialBadges order={firstOrder} /> : null}
      <div className="space-y-2.5 text-sm">
        <FinanceRow
          label="Total"
          value={finance.total > 0 ? formatAmount(finance.total) : '—'}
          valueClassName={FINANCE_VALUE_TOTAL_CLASS}
        />
        {finance.isFromPartner && (
          <FinanceRow
            label={`Partner ${finance.commissionPercentUsed}%`}
            value={`-${formatAmount(finance.partnerAmount)}`}
            valueClassName={FINANCE_VALUE_PARTNER_CLASS}
          />
        )}
        <FinanceRow
          label="Revenue"
          value={finance.revenue > 0 ? formatAmount(finance.revenue) : '—'}
          valueClassName={FINANCE_VALUE_REVENUE_CLASS}
        />
        <FinanceRow
          label="To Receive"
          value={formatAmount(finance.toReceive)}
          valueClassName={
            finance.toReceive > 0
              ? FINANCE_VALUE_TO_RECEIVE_DUE_CLASS
              : FINANCE_VALUE_TO_RECEIVE_CLEAR_CLASS
          }
        />
      </div>
    </section>
  );
}

function FinanceRow({
  label,
  value,
  valueClassName = FINANCE_VALUE_TOTAL_CLASS,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  const showCurrency = value !== '—';

  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('flex items-center justify-end gap-1 tabular-nums', valueClassName)}>
        {showCurrency ? <AmdCurrencyIcon className={valueClassName} /> : null}
        {value}
      </span>
    </div>
  );
}
