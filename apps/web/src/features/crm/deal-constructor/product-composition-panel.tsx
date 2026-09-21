'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { Button } from '@/components/ui/button';
import type { VisibleSalePrice } from '@/features/function-catalog/function-catalog-sale-price';
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { cn } from '@/lib/utils';
import { DealConstructorTotals } from './DealConstructorTotals';
import { CompositionCoreRail } from './composition-core-rail';
import { CompositionExtraList } from './composition-extra-list';
import { CompositionRemoveDialog, useCompositionRemove } from './composition-remove-dialog';
import { COMPOSITION_ADD_ICON_SIZE_PX, COMPOSITION_RAIL_GRID_CLASS } from './composition.constants';

type ProductCompositionPanelProps = {
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
  coreSalePriceLabel?: string;
  saleMissing?: 'core' | 'extra' | null;
  disabled: boolean;
  error?: string | null;
  canAdd: boolean;
  confirmRemove?: boolean;
  onAdd: () => void;
  onRemoveExtra: (functionId: string) => void;
};

export function ProductCompositionPanel(props: ProductCompositionPanelProps) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const remove = useCompositionRemove(props.confirmRemove !== false, props.onRemoveExtra);
  const coreItems = useQuery({
    queryKey: ['delivery-core-items', props.coreProfileVersionId],
    queryFn: () => deliveryCatalogStructureApi.listCoreItems(props.coreProfileVersionId ?? ''),
    enabled: Boolean(props.coreProfileVersionId),
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <CompositionPanelHeader
        title={props.title}
        canAdd={props.canAdd}
        disabled={props.disabled}
        addLabel={t('addFunctions')}
        onAdd={props.onAdd}
      />
      {props.error ? <p className="text-destructive text-sm">{props.error}</p> : null}
      <div className={cn(COMPOSITION_RAIL_GRID_CLASS, 'min-h-0 flex-1 overflow-y-auto')}>
        <CompositionCoreRail
          title={props.coreTitle}
          items={coreItems.data ?? []}
          loading={coreItems.isLoading}
          showSalePrice={props.showSalePrice}
          salePriceLabel={props.coreSalePriceLabel}
        />
        <CompositionExtraList
          extras={props.extras}
          showSalePrice={props.showSalePrice}
          salePriceByFunctionId={props.salePriceByFunctionId}
          unitsByFunctionId={props.canSeeUnits ? props.unitsByFunctionId : undefined}
          canRemove={!props.disabled && props.canAdd}
          onRemoveExtra={remove.request}
        />
      </div>
      <CompositionPanelFooter {...props} />
      <CompositionRemoveDialog
        title={remove.title}
        open={remove.open}
        onOpenChange={remove.onOpenChange}
        onConfirm={remove.onConfirm}
      />
    </div>
  );
}

function CompositionPanelHeader({
  title,
  canAdd,
  disabled,
  addLabel,
  onAdd,
}: {
  title?: string;
  canAdd: boolean;
  disabled: boolean;
  addLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      {title ? <h2 className="text-foreground text-lg font-semibold">{title}</h2> : <span />}
      {canAdd ? (
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onAdd}>
          <Plus size={COMPOSITION_ADD_ICON_SIZE_PX} />
          {addLabel}
        </Button>
      ) : null}
    </div>
  );
}

function CompositionPanelFooter({
  showSalePrice,
  saleTotal,
  unitsTotal,
  canSeeUnits,
  saleMissing,
}: Pick<
  ProductCompositionPanelProps,
  'showSalePrice' | 'saleTotal' | 'unitsTotal' | 'canSeeUnits' | 'saleMissing'
>) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  if (showSalePrice) {
    return (
      <DealConstructorTotals
        saleTotal={saleTotal}
        unitsTotal={unitsTotal}
        canSeeUnits={canSeeUnits}
        saleMissing={saleMissing}
      />
    );
  }
  if (canSeeUnits && unitsTotal !== undefined) {
    return (
      <div className="flex justify-end">
        <p className="text-muted-foreground text-sm">{t('unitsTotal', { count: unitsTotal })}</p>
      </div>
    );
  }
  return null;
}
