'use client';

import { useTranslations } from 'next-intl';
import { Layers } from 'lucide-react';
import { formatMoneyDram } from '@/lib/format/money';
import { cn } from '@/lib/utils';
import {
  COMPOSITION_DEAL_CARD_CLASS,
  COMPOSITION_DEAL_CHIP_CLASS,
  COMPOSITION_DEAL_METRIC_EXTRA_CLASS,
  COMPOSITION_DEAL_METRIC_LABEL_CLASS,
  COMPOSITION_DEAL_METRIC_PRICE_CLASS,
  COMPOSITION_DEAL_METRIC_PRICE_EMPTY_CLASS,
  COMPOSITION_DEAL_METRIC_UNITS_CLASS,
} from './composition.constants';

export function DealCompositionCard({
  typeLabel,
  platformLabel,
  extraCount,
  saleTotal,
  unitsTotal,
  canSeeUnits,
  ready,
  error,
  onOpen,
  hideMoney = false,
}: {
  typeLabel: string;
  platformLabel: string | null;
  extraCount: number;
  saleTotal: string | null;
  unitsTotal: number | undefined;
  canSeeUnits: boolean;
  ready: boolean;
  error?: string | null;
  onOpen: () => void;
  /** Delivery surfaces hide sale price and units (canon: money stays in Wallet/Finance). */
  hideMoney?: boolean;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  return (
    <button
      type="button"
      disabled={!ready}
      onClick={onOpen}
      className={cn(
        COMPOSITION_DEAL_CARD_CLASS,
        ready ? 'hover:bg-muted/40' : 'cursor-not-allowed opacity-70',
      )}
    >
      <span className="text-foreground flex items-center gap-2 text-sm font-semibold">
        <Layers size={14} />
        {t('cardTitle')}
      </span>
      {ready ? (
        <ReadyCardBody
          typeLabel={typeLabel}
          platformLabel={platformLabel}
          extraCount={extraCount}
          saleTotal={saleTotal}
          unitsTotal={unitsTotal}
          canSeeUnits={canSeeUnits}
          hideMoney={hideMoney}
        />
      ) : (
        <p className="text-muted-foreground text-xs">{t('choosePlatformAndType')}</p>
      )}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </button>
  );
}

function compositionMetricsGridClass(hideMoney: boolean, canSeeUnits: boolean): string {
  if (hideMoney) return 'grid-cols-1';
  return canSeeUnits ? 'grid-cols-3' : 'grid-cols-2';
}

function ReadyCardBody({
  typeLabel,
  platformLabel,
  extraCount,
  saleTotal,
  unitsTotal,
  canSeeUnits,
  hideMoney,
}: {
  typeLabel: string;
  platformLabel: string | null;
  extraCount: number;
  saleTotal: string | null;
  unitsTotal: number | undefined;
  canSeeUnits: boolean;
  hideMoney: boolean;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  return (
    <span className="flex flex-col gap-3">
      <span className="flex flex-wrap gap-1.5">
        {typeLabel ? <span className={COMPOSITION_DEAL_CHIP_CLASS}>{typeLabel}</span> : null}
        {platformLabel ? (
          <span className={COMPOSITION_DEAL_CHIP_CLASS}>{platformLabel}</span>
        ) : null}
      </span>
      <span className={cn('grid gap-3', compositionMetricsGridClass(hideMoney, canSeeUnits))}>
        <MetricTile
          label={t('extraMetric')}
          value={String(extraCount)}
          valueClass={COMPOSITION_DEAL_METRIC_EXTRA_CLASS}
        />
        {!hideMoney && canSeeUnits && unitsTotal !== undefined ? (
          <MetricTile
            label={t('unitsMetric')}
            value={String(unitsTotal)}
            valueClass={COMPOSITION_DEAL_METRIC_UNITS_CLASS}
          />
        ) : null}
        {hideMoney ? null : (
          <MetricTile
            label={t('priceMetric')}
            value={saleTotal ? formatMoneyDram(Number(saleTotal)) : '—'}
            valueClass={
              saleTotal
                ? COMPOSITION_DEAL_METRIC_PRICE_CLASS
                : COMPOSITION_DEAL_METRIC_PRICE_EMPTY_CLASS
            }
          />
        )}
      </span>
    </span>
  );
}

function MetricTile({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <span className="min-w-0 text-left">
      <span className={cn(COMPOSITION_DEAL_METRIC_LABEL_CLASS, 'block')}>{label}</span>
      <span className={cn(valueClass, 'block truncate')}>{value}</span>
    </span>
  );
}
