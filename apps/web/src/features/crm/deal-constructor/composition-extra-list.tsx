'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { FunctionCatalogCard } from '@/features/function-catalog/function-catalog-card';
import { formatMoneyDram } from '@/lib/format/money';
import type { VisibleSalePrice } from '@/features/function-catalog/function-catalog-sale-price';
import { COMPOSITION_EXTRA_GRID_CLASS } from './composition.constants';
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
  const t = useTranslations('crm.dealSheet.dealConstructor');
  if (extras.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('noExtras')}</p>;
  }
  return (
    <div className={COMPOSITION_EXTRA_GRID_CLASS}>
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
