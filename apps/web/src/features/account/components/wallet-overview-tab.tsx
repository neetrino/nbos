'use client';

import { ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletHeroCard } from '@/features/account/components/wallet-hero-card';
import { WalletPipelineChart } from '@/features/account/components/wallet-pipeline-chart';
import { WalletCompensationGlossary } from '@/features/account/components/wallet-compensation-glossary';
import { computeWalletOverviewMetrics } from '@/features/account/utils/wallet-overview-metrics';
import { formatAmount } from '@/features/finance/constants/finance';
import type { EmployeeWalletSnapshot } from '@/lib/api/me';
import { useTranslations } from 'next-intl';

function parseAmount(value: string | null | undefined): number {
  if (value == null || value === '') return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

interface WalletOverviewTabProps {
  data: EmployeeWalletSnapshot;
  onOpenMonth: (salaryLineId: string) => void;
  onGoToBonuses: () => void;
  onGoToPayroll: () => void;
}

export function WalletOverviewTab({
  data,
  onOpenMonth,
  onGoToBonuses,
  onGoToPayroll,
}: WalletOverviewTabProps) {
  const t = useTranslations('account.wallet.overview');
  const metrics = computeWalletOverviewMetrics(data);
  const { nextPayroll } = data;

  return (
    <div className="space-y-5 px-5 py-4">
      <WalletHeroCard metrics={metrics} />

      <section className="nbos-insight-panel">
        <h3 className="text-foreground text-sm font-semibold">{t('pipelineTitle')}</h3>
        <p className="text-muted-foreground mt-1 text-xs leading-snug">{t('pipelineHint')}</p>
        <div className="mt-4">
          <WalletPipelineChart segments={metrics.pipelineSegments} />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-primary mt-3 h-8 px-2 text-xs"
          onClick={onGoToBonuses}
        >
          {t('viewBonuses')}
          <ArrowRight size={14} className="ml-1" aria-hidden />
        </Button>
      </section>

      {nextPayroll ? (
        <section className="nbos-insight-panel">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <div className="nbos-insight-panel-icon">
                <Calendar size={16} className="text-primary" aria-hidden />
              </div>
              <div>
                <h3 className="text-foreground text-sm font-semibold">{t('upcomingPayroll')}</h3>
                <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                  {nextPayroll.payrollMonth} · {nextPayroll.runStatus}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => onOpenMonth(nextPayroll.salaryLineId)}
            >
              {t('details')}
            </Button>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div className="nbos-metric-row p-3">
              <dt className="text-muted-foreground">{t('base')}</dt>
              <dd className="text-foreground mt-1 font-semibold tabular-nums">
                {formatAmount(parseAmount(nextPayroll.baseSalary))}
              </dd>
            </div>
            <div className="nbos-metric-row p-3">
              <dt className="text-muted-foreground">{t('bonuses')}</dt>
              <dd className="text-foreground mt-1 font-semibold tabular-nums">
                {formatAmount(parseAmount(nextPayroll.bonusesTotal))}
              </dd>
            </div>
            <div className="nbos-metric-row p-3">
              <dt className="text-muted-foreground">{t('total')}</dt>
              <dd className="text-foreground mt-1 font-semibold tabular-nums">
                {formatAmount(parseAmount(nextPayroll.totalPayable))}
              </dd>
            </div>
            <div className="nbos-metric-row p-3">
              <dt className="text-muted-foreground">{t('remaining')}</dt>
              <dd className="text-foreground mt-1 font-semibold tabular-nums">
                {formatAmount(parseAmount(nextPayroll.remainingAmount))}
              </dd>
            </div>
          </dl>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-primary mt-3 h-8 px-2 text-xs"
            onClick={onGoToPayroll}
          >
            {t('fullHistory')}
            <ArrowRight size={14} className="ml-1" aria-hidden />
          </Button>
        </section>
      ) : null}

      <WalletCompensationGlossary />
    </div>
  );
}
