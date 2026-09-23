'use client';

import { useTranslations } from 'next-intl';
import {
  sumSalePrices,
  VOLUME_FACTOR_STANDARD,
  type DeliveryFunctionOperationalDto,
} from '@nbos/shared';
import { FunctionCatalogCard } from '@/features/function-catalog/function-catalog-card';
import { formatMoneyDram } from '@/lib/format/money';
import type { VisibleSalePrice } from '@/features/function-catalog/function-catalog-sale-price';
import { cn } from '@/lib/utils';
import { CompositionSummaryRow } from './composition-base-board';
import {
  COMPOSITION_CARD_GRID_CLASS,
  COMPOSITION_CORE_CARD_CLASS,
  COMPOSITION_DEAL_METRIC_PRICE_CLASS,
  COMPOSITION_DEAL_METRIC_PRICE_EMPTY_CLASS,
} from './composition.constants';
import { VolumeFactorControl } from './volume-factor-control';

type CompositionExtraListProps = {
  extras: DeliveryFunctionOperationalDto[];
  showSalePrice: boolean;
  salePriceByFunctionId: Map<string, VisibleSalePrice>;
  unitsByFunctionId: Map<string, number> | undefined;
  canRemove: boolean;
  onRemoveExtra: (item: DeliveryFunctionOperationalDto) => void;
  volumeByFunctionId?: Map<string, string>;
  volumeDisabled?: boolean;
  onVolume?: (functionId: string, factor: string, reason: string | null) => void;
};

export function CompositionExtraSummary({
  count,
  showSalePrice,
  salePriceByFunctionId,
  extraIds,
  ruleLabel,
  volumeByFunctionId,
  volumeDisabled,
  onVolume,
}: {
  count: number;
  showSalePrice: boolean;
  salePriceByFunctionId: Map<string, VisibleSalePrice>;
  extraIds: readonly string[];
  ruleLabel: string;
  volumeByFunctionId?: Map<string, string>;
  volumeDisabled?: boolean;
  onVolume?: (factor: string, reason: string | null) => void;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const total = extraSaleTotal(extraIds, salePriceByFunctionId, showSalePrice);
  return (
    <CompositionSummaryRow label={ruleLabel}>
      <div className={COMPOSITION_CORE_CARD_CLASS}>
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-semibold tracking-tight">
            {t('extraCount', { count })}
          </p>
          {showSalePrice ? <ExtraTotalPrice total={total} unknown={t('corePriceUnknown')} /> : null}
        </div>
        {onVolume ? (
          <VolumeFactorControl
            density="summary"
            factor={sharedExtraFactor(extraIds, volumeByFunctionId)}
            disabled={volumeDisabled}
            onCommit={onVolume}
          />
        ) : null}
      </div>
    </CompositionSummaryRow>
  );
}

function ExtraTotalPrice({ total, unknown }: { total: string | null; unknown: string }) {
  return (
    <p
      className={cn(
        'mt-0.5',
        total ? COMPOSITION_DEAL_METRIC_PRICE_CLASS : COMPOSITION_DEAL_METRIC_PRICE_EMPTY_CLASS,
      )}
    >
      {total ?? unknown}
    </p>
  );
}

function sharedExtraFactor(
  extraIds: readonly string[],
  volumes: Map<string, string> | undefined,
): string {
  if (!volumes || extraIds.length === 0) return VOLUME_FACTOR_STANDARD;
  const first = volumes.get(extraIds[0] ?? '') ?? VOLUME_FACTOR_STANDARD;
  const same = extraIds.every((id) => (volumes.get(id) ?? VOLUME_FACTOR_STANDARD) === first);
  return same ? first : VOLUME_FACTOR_STANDARD;
}

function extraSaleTotal(
  extraIds: readonly string[],
  prices: Map<string, VisibleSalePrice>,
  showSalePrice: boolean,
): string | null {
  if (!showSalePrice) return null;
  const total = sumSalePrices(extraIds.map((id) => prices.get(id)?.amount ?? null));
  return total === null ? null : formatMoneyDram(Number(total));
}

export function CompositionExtraList({
  extras,
  showSalePrice,
  salePriceByFunctionId,
  unitsByFunctionId,
  canRemove,
  onRemoveExtra,
  volumeByFunctionId,
  volumeDisabled,
  onVolume,
}: CompositionExtraListProps) {
  if (extras.length === 0) return null;
  return (
    <div className={COMPOSITION_CARD_GRID_CLASS}>
      {extras.map((item) => (
        <ExtraVolumeCard
          key={item.id}
          item={item}
          showSalePrice={showSalePrice}
          sale={salePriceByFunctionId.get(item.id)}
          units={unitsByFunctionId?.get(item.id)}
          canRemove={canRemove}
          volumeFactor={volumeByFunctionId?.get(item.id) ?? '1.0'}
          volumeDisabled={volumeDisabled}
          onRemove={() => onRemoveExtra(item)}
          onVolume={onVolume}
        />
      ))}
    </div>
  );
}

function ExtraVolumeCard({
  item,
  showSalePrice,
  sale,
  units,
  canRemove,
  volumeFactor,
  volumeDisabled,
  onRemove,
  onVolume,
}: {
  item: DeliveryFunctionOperationalDto;
  showSalePrice: boolean;
  sale: VisibleSalePrice | undefined;
  units: number | undefined;
  canRemove: boolean;
  volumeFactor: string;
  volumeDisabled?: boolean;
  onRemove: () => void;
  onVolume?: (functionId: string, factor: string, reason: string | null) => void;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  return (
    <FunctionCatalogCard
      item={item}
      variant="compact"
      extraLabel={t('extraBadge')}
      unitsLabel={units === undefined ? undefined : String(units)}
      salePriceLabel={showSalePrice && sale ? formatMoneyDram(Number(sale.amount)) : undefined}
      removeLabel={canRemove ? t('removeFunctionAria', { title: item.title }) : undefined}
      onRemove={canRemove ? onRemove : undefined}
      accessory={
        onVolume ? (
          <VolumeFactorControl
            density="compact"
            factor={volumeFactor}
            disabled={volumeDisabled}
            onCommit={(factor, reason) => onVolume(item.id, factor, reason)}
          />
        ) : undefined
      }
    />
  );
}
