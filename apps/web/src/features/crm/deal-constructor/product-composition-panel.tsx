'use client';

import type { ComponentProps } from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/shared';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { Button } from '@/components/ui/button';
import type { VisibleSalePrice } from '@/features/function-catalog/function-catalog-sale-price';
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { cn } from '@/lib/utils';
import { DealConstructorTotals } from './DealConstructorTotals';
import { CompositionCoreRail } from './composition-core-rail';
import { CompositionExtraList } from './composition-extra-list';
import { CompositionRemoveDialog, useCompositionRemove } from './composition-remove-dialog';
import type { CompositionProductTypeChange } from './composition-core-type-menu';
import { COMPOSITION_ADD_ICON_SIZE_PX, COMPOSITION_RAIL_GRID_CLASS } from './composition.constants';

type ProductCompositionPanelProps = {
  title?: string;
  coreProfileVersionId: string | null;
  coreTitle: string | null;
  included: Array<{ id: string; title: string }>;
  extras: DeliveryFunctionOperationalDto[];
  blockedHint?: string | null;
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
  onClearExtras?: () => void;
  productType?: CompositionProductTypeChange | null;
};

export function ProductCompositionPanel(props: ProductCompositionPanelProps) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const remove = useCompositionRemove(props.confirmRemove !== false, props.onRemoveExtra);
  const coreItems = useCoreChecklist(props.coreProfileVersionId);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <CompositionPanelHeader
        title={props.title}
        canAdd={props.canAdd}
        disabled={props.disabled}
        blockedHint={props.blockedHint}
        addLabel={t('addFunctions')}
        onAdd={props.onAdd}
      />
      {props.error ? <p className="text-destructive text-sm">{props.error}</p> : null}
      <div className={cn(COMPOSITION_RAIL_GRID_CLASS, 'min-h-0 flex-1 overflow-y-auto')}>
        <div className="order-2 lg:order-1">
          <CompositionCoreRail
            title={props.coreTitle}
            items={coreItems.data ?? []}
            included={props.included}
            loading={coreItems.isLoading}
            showSalePrice={props.showSalePrice}
            salePriceLabel={props.coreSalePriceLabel}
            productType={props.productType}
          />
        </div>
        <CompositionExtrasColumn
          extras={props.extras}
          showSalePrice={props.showSalePrice}
          salePriceByFunctionId={props.salePriceByFunctionId}
          unitsByFunctionId={props.canSeeUnits ? props.unitsByFunctionId : undefined}
          canRemove={!props.disabled && props.canAdd}
          onRemoveExtra={remove.request}
          onClearExtras={props.onClearExtras}
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

function useCoreChecklist(coreProfileVersionId: string | null) {
  return useQuery({
    queryKey: ['delivery-core-items', coreProfileVersionId],
    queryFn: () => deliveryCatalogStructureApi.listCoreItems(coreProfileVersionId ?? ''),
    enabled: Boolean(coreProfileVersionId),
  });
}

function CompositionExtrasColumn({
  onClearExtras,
  canRemove,
  extras,
  ...list
}: ComponentProps<typeof CompositionExtraList> & { onClearExtras?: () => void }) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  return (
    <div className="order-1 flex min-w-0 flex-col gap-3 lg:order-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {t('extrasHeading')}
          </p>
          <p className="text-muted-foreground text-xs">{t('extrasScope')}</p>
        </div>
        {onClearExtras ? (
          <ClearExtrasButton disabled={!canRemove || extras.length === 0} onClear={onClearExtras} />
        ) : null}
      </div>
      <CompositionExtraList extras={extras} canRemove={canRemove} {...list} />
    </div>
  );
}

function ClearExtrasButton({ disabled, onClear }: { disabled: boolean; onClear: () => void }) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const tCommon = useTranslations('common');
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {t('clearExtras')}
      </Button>
      <DeleteConfirmDialog
        open={open}
        onOpenChange={setOpen}
        level="simple"
        itemName={t('extrasHeading')}
        title={t('clearExtrasTitle')}
        description={t('clearExtrasDescription')}
        confirmLabel={t('clearExtras')}
        dismissLabel={tCommon('cancel')}
        forceNestedBackdrop
        onConfirm={() => {
          setOpen(false);
          onClear();
        }}
      />
    </>
  );
}

function CompositionPanelHeader({
  title,
  canAdd,
  disabled,
  blockedHint,
  addLabel,
  onAdd,
}: {
  title?: string;
  canAdd: boolean;
  disabled: boolean;
  blockedHint?: string | null;
  addLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        {title ? <h2 className="text-foreground text-lg font-semibold">{title}</h2> : <span />}
        {canAdd ? (
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onAdd}>
            <Plus size={COMPOSITION_ADD_ICON_SIZE_PX} />
            {addLabel}
          </Button>
        ) : null}
      </div>
      {blockedHint ? <p className="text-muted-foreground text-sm">{blockedHint}</p> : null}
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
