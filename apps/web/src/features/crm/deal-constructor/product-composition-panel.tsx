'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { Button } from '@/components/ui/button';
import { FunctionCatalogCard } from '@/features/function-catalog/function-catalog-card';
import { formatMoneyDram } from '@/lib/format/money';
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { DealConstructorCollections } from './DealConstructorCollections';
import { DealConstructorTotals } from './DealConstructorTotals';
import type { FunctionCollectionDto } from '@/lib/api/delivery-catalog-structure';
import type { VisibleSalePrice } from '@/features/function-catalog/function-catalog-sale-price';

export function ProductCompositionPanel({
  coreProfileVersionId,
  coreTitle,
  extras,
  collections,
  appliedCollectionId,
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
  onApplyCollection,
  onRemoveExtra,
}: {
  coreProfileVersionId: string | null;
  coreTitle: string | null;
  extras: DeliveryFunctionOperationalDto[];
  collections: FunctionCollectionDto[];
  appliedCollectionId: string | null;
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
  onApplyCollection: (collectionId: string) => void;
  onRemoveExtra: (functionId: string) => void;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const coreItems = useQuery({
    queryKey: ['delivery-core-items', coreProfileVersionId],
    queryFn: () => deliveryCatalogStructureApi.listCoreItems(coreProfileVersionId ?? ''),
    enabled: Boolean(coreProfileVersionId),
  });

  return (
    <div className="space-y-6">
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {showSalePrice ? (
        <DealConstructorTotals
          saleTotal={saleTotal}
          unitsTotal={unitsTotal}
          canSeeUnits={canSeeUnits}
        />
      ) : canSeeUnits && unitsTotal !== undefined ? (
        <p className="text-muted-foreground text-sm">{t('unitsTotal', { count: unitsTotal })}</p>
      ) : null}
      <CoreReadout title={coreTitle} items={coreItems.data ?? []} loading={coreItems.isLoading} />
      <DealConstructorCollections
        collections={collections}
        appliedCollectionId={appliedCollectionId}
        disabled={disabled || !canAdd}
        onApply={onApplyCollection}
      />
      <ExtraList
        extras={extras}
        showSalePrice={showSalePrice}
        salePriceByFunctionId={salePriceByFunctionId}
        unitsByFunctionId={canSeeUnits ? unitsByFunctionId : undefined}
        disabled={disabled || !canAdd}
        onRemoveExtra={onRemoveExtra}
      />
      {canAdd ? (
        <Button type="button" size="lg" className="w-full" disabled={disabled} onClick={onAdd}>
          {t('addFunctions')}
        </Button>
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
