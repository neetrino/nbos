'use client';

import { useMemo } from 'react';
import { StatusBadge } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import type { EmployeeWalletSalaryRow } from '@/lib/api/me';
import type { CompensationPayoutPhase } from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const WALLET_PHASE_ORDER: readonly CompensationPayoutPhase[] = [
  'active_payout',
  'accumulating',
  'past_paid',
] as const;

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function progressLabel(paid: string, total: string): string {
  return `${formatAmount(parseAmount(paid))} / ${formatAmount(parseAmount(total))}`;
}

export function WalletSalaryMonthCards({
  rows,
  onOpenMonth,
  highlightSalaryLineId,
}: {
  rows: EmployeeWalletSalaryRow[];
  onOpenMonth: (salaryLineId: string) => void;
  highlightSalaryLineId?: string | null;
}) {
  const byPhase = useMemo(() => {
    const map = new Map<CompensationPayoutPhase, EmployeeWalletSalaryRow[]>();
    for (const phase of WALLET_PHASE_ORDER) {
      map.set(phase, []);
    }
    for (const row of rows) {
      map.get(row.payoutPhase)?.push(row);
    }
    for (const phase of WALLET_PHASE_ORDER) {
      const list = map.get(phase) ?? [];
      list.sort((a, b) => b.payrollMonth.localeCompare(a.payrollMonth));
    }
    return map;
  }, [rows]);

  const t = useTranslations('account.wallet.payroll');
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('emptyMonths')}</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {WALLET_PHASE_ORDER.map((phase) => {
        const phaseRows = byPhase.get(phase) ?? [];
        return (
          <div key={phase} className="border-border bg-card flex flex-col rounded-xl border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-foreground text-xs font-semibold">
                {phase === 'active_payout'
                  ? t('phaseActive')
                  : phase === 'accumulating'
                    ? t('phaseAccumulating')
                    : t('phasePaid')}
              </h3>
              <StatusBadge label={String(phaseRows.length)} variant="gray" />
            </div>
            <p className="text-muted-foreground mt-1 text-[11px] leading-snug">
              {phase === 'active_payout'
                ? t('phaseActiveHint')
                : phase === 'accumulating'
                  ? t('phaseAccumulatingHint')
                  : t('phasePaidHint')}
            </p>
            <ul className="mt-3 flex flex-1 flex-col gap-2">
              {phaseRows.length === 0 ? (
                <li className="text-muted-foreground text-xs">{t('emptyPhase')}</li>
              ) : (
                phaseRows.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => onOpenMonth(row.id)}
                      className={cn(
                        'hover:bg-muted/60 border-border w-full rounded-lg border px-3 py-2.5 text-left text-xs transition-colors',
                        highlightSalaryLineId === row.id && 'ring-primary ring-2',
                      )}
                    >
                      <div className="text-foreground font-semibold tabular-nums">
                        {row.payrollMonth}
                      </div>
                      <div className="text-muted-foreground mt-1 tabular-nums">
                        {progressLabel(row.paidAmount, row.totalPayable)}
                      </div>
                      <div className="text-muted-foreground mt-0.5">
                        {t('remaining', { amount: formatAmount(parseAmount(row.remainingAmount)) })}
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
