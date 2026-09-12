'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  nextPayrollBonusLineAmount,
  summarizeWalletBonusForecast,
} from '@/features/finance/utils/wallet-bonus-forecast-summary';
import type { EmployeeWalletSnapshot } from '@/lib/api/me';

export function WalletBonusForecastCard({ data }: { data: EmployeeWalletSnapshot }) {
  const summary = useMemo(() => summarizeWalletBonusForecast(data.bonuses), [data.bonuses]);
  const nextPayrollBonuses = nextPayrollBonusLineAmount(data.nextPayroll);

  const t = useTranslations('account.wallet.forecast');
  const incomingTotal = summary.incomingPlanned + summary.inProgressPlanned;
  const earnedPath = summary.nextPayrollRemaining + summary.paidFromReleases;

  return (
    <section className="border-border bg-card rounded-2xl border p-5">
      <h2 className="text-foreground text-sm font-semibold">{t('title')}</h2>
      <p className="text-muted-foreground mt-1 text-xs leading-snug">{t('hint')}</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="border-border bg-muted/15 rounded-lg border px-3 py-2.5">
          <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {t('incoming')}
          </dt>
          <dd className="text-foreground mt-1 text-lg font-semibold tabular-nums">
            {formatAmount(incomingTotal)}
          </dd>
          <dd className="text-muted-foreground mt-1 text-[11px] leading-snug">
            {t('incomingSplit', {
              potential: formatAmount(summary.incomingPlanned),
              inProgress: formatAmount(summary.inProgressPlanned),
            })}
          </dd>
        </div>
        <div className="border-border bg-muted/15 rounded-lg border px-3 py-2.5">
          <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {t('earned')}
          </dt>
          <dd className="text-foreground mt-1 text-lg font-semibold tabular-nums">
            {formatAmount(earnedPath)}
          </dd>
          <dd className="text-muted-foreground mt-1 text-[11px] leading-snug">
            {t('earnedSplit', {
              queue: formatAmount(summary.nextPayrollRemaining),
              paid: formatAmount(summary.paidFromReleases),
            })}
          </dd>
        </div>
      </dl>
      {nextPayrollBonuses != null && nextPayrollBonuses > 0 ? (
        <p className="text-muted-foreground mt-3 text-xs leading-snug">
          {t('openPayroll', { amount: formatAmount(nextPayrollBonuses) })}
        </p>
      ) : null}
      {summary.correctionsPlanned > 0 ? (
        <p className="text-muted-foreground mt-2 text-xs leading-snug">
          {t('corrections', { amount: formatAmount(summary.correctionsPlanned) })}
        </p>
      ) : null}
    </section>
  );
}
