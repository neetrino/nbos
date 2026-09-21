'use client';

import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { FunctionCatalogCard } from '@/features/function-catalog/function-catalog-card';
import { formatMoneyDram } from '@/lib/format/money';
import type { VisibleSalePrice } from '@/features/function-catalog/function-catalog-sale-price';
import { COMPOSITION_EXTRA_GRID_CLASS } from './composition.constants';

export function CompositionExtraList({
  extras,
  showSalePrice,
  salePriceByFunctionId,
  unitsByFunctionId,
  canRemove,
  onRemoveExtra,
}: {
  extras: DeliveryFunctionOperationalDto[];
  showSalePrice: boolean;
  salePriceByFunctionId: Map<string, VisibleSalePrice>;
  unitsByFunctionId: Map<string, number> | undefined;
  canRemove: boolean;
  onRemoveExtra: (item: DeliveryFunctionOperationalDto) => void;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  if (extras.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('noExtras')}</p>;
  }
  return (
    <div className={COMPOSITION_EXTRA_GRID_CLASS}>
      {extras.map((item) => {
        const sale = salePriceByFunctionId.get(item.id);
        return (
          <FunctionCatalogCard
            key={item.id}
            item={item}
            variant="compact"
            extraLabel={t('extraBadge')}
            unitsLabel={
              unitsByFunctionId?.has(item.id) ? String(unitsByFunctionId.get(item.id)) : undefined
            }
            salePriceLabel={
              showSalePrice && sale ? formatMoneyDram(Number(sale.amount)) : undefined
            }
            removeLabel={canRemove ? t('removeFunctionAria', { title: item.title }) : undefined}
            onRemove={canRemove ? () => onRemoveExtra(item) : undefined}
          />
        );
      })}
    </div>
  );
}
