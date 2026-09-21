'use client';

import { useTranslations } from 'next-intl';
import { Layers } from 'lucide-react';
import { formatMoneyDram } from '@/lib/format/money';
import { cn } from '@/lib/utils';

const CARD_CLASS =
  'border-border bg-card flex w-full flex-col gap-2 rounded-2xl border p-4 text-left';

export function DealCompositionCard({
  typeLabel,
  platformLabel,
  coreTitle,
  extraCount,
  saleTotal,
  unitsTotal,
  canSeeUnits,
  ready,
  error,
  onOpen,
}: {
  typeLabel: string;
  platformLabel: string | null;
  coreTitle: string | null;
  extraCount: number;
  saleTotal: string | null;
  unitsTotal: number | undefined;
  canSeeUnits: boolean;
  ready: boolean;
  error?: string | null;
  onOpen: () => void;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  return (
    <button
      type="button"
      disabled={!ready}
      onClick={onOpen}
      className={cn(CARD_CLASS, ready ? 'hover:bg-muted/40' : 'cursor-not-allowed opacity-70')}
    >
      <span className="text-foreground flex items-center gap-2 text-sm font-semibold">
        <Layers size={14} />
        {t('cardTitle')}
      </span>
      {ready ? (
        <ReadyCardBody
          typeLabel={typeLabel}
          platformLabel={platformLabel}
          coreTitle={coreTitle}
          extraCount={extraCount}
          saleTotal={saleTotal}
          unitsTotal={unitsTotal}
          canSeeUnits={canSeeUnits}
        />
      ) : (
        <p className="text-muted-foreground text-xs">{t('choosePlatformAndType')}</p>
      )}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </button>
  );
}

function ReadyCardBody({
  typeLabel,
  platformLabel,
  coreTitle,
  extraCount,
  saleTotal,
  unitsTotal,
  canSeeUnits,
}: {
  typeLabel: string;
  platformLabel: string | null;
  coreTitle: string | null;
  extraCount: number;
  saleTotal: string | null;
  unitsTotal: number | undefined;
  canSeeUnits: boolean;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  return (
    <span className="space-y-1">
      <span className="text-foreground block text-xs font-medium">
        {[typeLabel, platformLabel].filter(Boolean).join(' · ')}
      </span>
      {coreTitle ? <span className="text-muted-foreground block text-xs">{coreTitle}</span> : null}
      <span className="text-muted-foreground block text-xs">
        {t('extraCount', { count: extraCount })}
      </span>
      <span className="text-foreground block text-xs font-medium tabular-nums">
        {saleTotal ? formatMoneyDram(Number(saleTotal)) : t('saleUnknown')}
      </span>
      {canSeeUnits && unitsTotal !== undefined ? (
        <span className="text-muted-foreground block text-xs">
          {t('unitsTotal', { count: unitsTotal })}
        </span>
      ) : null}
    </span>
  );
}
