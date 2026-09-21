'use client';

import { useTranslations } from 'next-intl';
import { formatMoneyDram } from '@/lib/format/money';

export function DealConstructorTotals({
  saleTotal,
  unitsTotal,
  canSeeUnits,
}: {
  saleTotal: string | null;
  unitsTotal: number | undefined;
  canSeeUnits: boolean;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  return (
    <div className="border-border/60 bg-muted/10 space-y-1 rounded-xl border px-4 py-3">
      <p className="text-foreground text-sm font-medium">
        {t('saleTotal')}: {saleTotal ? formatMoneyDram(Number(saleTotal)) : t('saleUnknown')}
      </p>
      {canSeeUnits && unitsTotal !== undefined ? (
        <p className="text-muted-foreground text-xs">{t('unitsTotal', { count: unitsTotal })}</p>
      ) : null}
      <p className="text-muted-foreground text-xs">{t('amountHint')}</p>
    </div>
  );
}
