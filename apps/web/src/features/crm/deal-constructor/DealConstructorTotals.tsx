'use client';

import { useTranslations } from 'next-intl';
import { formatMoneyDram } from '@/lib/format/money';
import { cn } from '@/lib/utils';

export function DealConstructorTotals({
  saleTotal,
  unitsTotal,
  canSeeUnits,
  saleMissing,
}: {
  saleTotal: string | null;
  unitsTotal: number | undefined;
  canSeeUnits: boolean;
  saleMissing?: 'core' | 'extra' | null;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  return (
    <div className="border-border flex justify-end border-t pt-4">
      <div className="space-y-0.5 text-right">
        <p className="text-muted-foreground text-xs">{t('saleTotal')}</p>
        <p
          className={cn(
            'tabular-nums',
            saleTotal
              ? 'text-foreground text-xl font-semibold tracking-tight'
              : 'text-muted-foreground text-sm',
          )}
        >
          {saleTotal ? formatMoneyDram(Number(saleTotal)) : t(saleUnknownKey(saleMissing))}
        </p>
        {canSeeUnits && unitsTotal !== undefined ? (
          <p className="text-muted-foreground text-xs">{t('unitsTotal', { count: unitsTotal })}</p>
        ) : null}
      </div>
    </div>
  );
}

function saleUnknownKey(
  missing: 'core' | 'extra' | null | undefined,
): 'saleUnknownCore' | 'saleUnknownExtra' | 'saleUnknown' {
  if (missing === 'core') return 'saleUnknownCore';
  if (missing === 'extra') return 'saleUnknownExtra';
  return 'saleUnknown';
}
