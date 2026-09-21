'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { Button } from '@/components/ui/button';
import { FunctionCatalogCard } from '@/features/function-catalog/function-catalog-card';
import { formatMoneyDram } from '@/lib/format/money';
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { DealConstructorTotals } from './DealConstructorTotals';
import type { VisibleSalePrice } from '@/features/function-catalog/function-catalog-sale-price';
import { COMPOSITION_ADD_ICON_SIZE_PX } from './composition.constants';

export function ProductCompositionPanel({
  title,
  coreProfileVersionId,
  coreTitle,
  extras,
  saleTotal,
  unitsTotal,
  canSeeUnits,
  showSalePrice,
  salePriceByFunctionId,
  unitsByFunctionId,
  disabled,
  error,
  canAdd,
  onAdd,
  onRemoveExtra,
}: {
  title?: string;
  coreProfileVersionId: string | null;
  coreTitle: string | null;
  extras: DeliveryFunctionOperationalDto[];
  saleTotal: string | null;
  unitsTotal: number | undefined;
  canSeeUnits: boolean;
  showSalePrice: boolean;
  salePriceByFunctionId: Map<string, VisibleSalePrice>;
  unitsByFunctionId: Map<string, number> | undefined;
  disabled: boolean;
  error?: string | null;
  canAdd: boolean;
  onAdd: () => void;
  onRemoveExtra: (functionId: string) => void;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const coreItems = useQuery({
    queryKey: ['delivery-core-items', coreProfileVersionId],
    queryFn: () => deliveryCatalogStructureApi.listCoreItems(coreProfileVersionId ?? ''),
    enabled: Boolean(coreProfileVersionId),
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        {title ? <h2 className="text-foreground text-lg font-semibold">{title}</h2> : <span />}
        {canAdd ? (
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onAdd}>
            <Plus size={COMPOSITION_ADD_ICON_SIZE_PX} />
            {t('addFunctions')}
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
        <CoreReadout title={coreTitle} items={coreItems.data ?? []} loading={coreItems.isLoading} />
        <ExtraList
          extras={extras}
          showSalePrice={showSalePrice}
          salePriceByFunctionId={salePriceByFunctionId}
          unitsByFunctionId={canSeeUnits ? unitsByFunctionId : undefined}
          disabled={disabled || !canAdd}
          onRemoveExtra={onRemoveExtra}
        />
      </div>
      {showSalePrice ? (
        <DealConstructorTotals
          saleTotal={saleTotal}
          unitsTotal={unitsTotal}
          canSeeUnits={canSeeUnits}
        />
      ) : canSeeUnits && unitsTotal !== undefined ? (
        <div className="flex justify-end">
          <p className="text-muted-foreground text-sm">{t('unitsTotal', { count: unitsTotal })}</p>
        </div>
      ) : null}
    </div>
  );
}

function CoreReadout({
  title,
  items,
  loading,
}: {
  title: string | null;
  items: Array<{ id: string; label: string }>;
  loading: boolean;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  return (
    <section className="space-y-2">
      <h3 className="text-foreground text-sm font-semibold">{t('coreLabel')}</h3>
      {title ? <p className="text-muted-foreground text-sm">{title}</p> : null}
      {loading ? <p className="text-muted-foreground text-xs">{t('coreLoading')}</p> : null}
      <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item.id}>{item.label}</li>
        ))}
      </ul>
    </section>
  );
}

function ExtraList({
  extras,
  showSalePrice,
  salePriceByFunctionId,
  unitsByFunctionId,
  disabled,
  onRemoveExtra,
}: {
  extras: DeliveryFunctionOperationalDto[];
  showSalePrice: boolean;
  salePriceByFunctionId: Map<string, VisibleSalePrice>;
  unitsByFunctionId: Map<string, number> | undefined;
  disabled: boolean;
  onRemoveExtra: (functionId: string) => void;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  if (extras.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('noExtras')}</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {extras.map((item) => {
        const sale = salePriceByFunctionId.get(item.id);
        return (
          <FunctionCatalogCard
            key={item.id}
            item={item}
            selected
            unitsLabel={
              unitsByFunctionId?.has(item.id) ? String(unitsByFunctionId.get(item.id)) : undefined
            }
            salePriceLabel={
              showSalePrice && sale ? formatMoneyDram(Number(sale.amount)) : undefined
            }
            onToggle={disabled ? undefined : onRemoveExtra}
          />
        );
      })}
    </div>
  );
}
