'use client';

import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared';
import { formatMoneyDram } from '@/lib/format/money';
import type { CompensationProfileRow } from '@/lib/api/compensation-profiles';

export function SalaryHistoryList({ profiles }: { profiles: readonly CompensationProfileRow[] }) {
  const t = useTranslations('hr.salaries');
  if (profiles.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('noHistory')}</p>;
  }

  return (
    <ul className="space-y-3">
      {profiles.map((profile) => (
        <li key={profile.id} className="border-border bg-card rounded-2xl border px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-foreground text-base font-semibold tabular-nums">
              {formatMoneyDram(Number.parseFloat(profile.baseSalary))}
            </p>
            <StatusBadge
              label={t(`status.${profile.status}`)}
              variant={profile.status === 'ACTIVE' ? 'green' : 'gray'}
            />
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {t('historyFrom', { date: profile.effectiveFrom.slice(0, 10) })}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {profile.bonusPolicy?.name ?? t('bonusOff')}
          </p>
          <p className="text-muted-foreground text-sm">{profile.kpiPolicy?.name ?? t('kpiOff')}</p>
        </li>
      ))}
    </ul>
  );
}
