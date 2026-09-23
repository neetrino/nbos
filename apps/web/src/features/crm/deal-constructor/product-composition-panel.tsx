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
import {
  deliveryCatalogStructureApi,
  type CoreItemDto,
} from '@/lib/api/delivery-catalog-structure';
import { DealConstructorTotals } from './DealConstructorTotals';
import { CompositionBaseBoard, CompositionBaseRule } from './composition-base-board';
import { CompositionExtraList } from './composition-extra-list';
import { CompositionRemoveDialog, useCompositionRemove } from './composition-remove-dialog';
import type { CompositionProductTypeChange } from './composition-core-type-menu';
import {
  COMPOSITION_ADD_ICON_SIZE_PX,
  COMPOSITION_CONTROL_ROW_CLASS,
} from './composition.constants';
import { VolumeFactorControl } from './volume-factor-control';
import { VOLUME_FACTOR_STANDARD } from '@nbos/shared';

type ProductCompositionPanelProps = {
  title?: string;
  coreProfileVersionId: string | null;
  coreTitle: string | null;
  included: Array<{ id: string; title: string; iconKey?: string }>;
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
  coreVolumeFactor?: string;
  volumeByFunctionId?: Map<string, string>;
  onCoreVolume?: (factor: string, reason: string | null) => void;
  onFunctionVolume?: (functionId: string, factor: string, reason: string | null) => void;
  onExtrasVolume?: (factor: string, reason: string | null) => void;
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
        canReset={Boolean(props.onClearExtras) && props.extras.length > 0}
        resetDisabled={props.disabled || !props.canAdd}
        onReset={props.onClearExtras}
      />
      {props.error ? <p className="text-destructive text-sm">{props.error}</p> : null}
      <CompositionRails
        props={props}
        coreItems={coreItems.data ?? []}
        coreLoading={coreItems.isLoading}
        onRemoveExtra={remove.request}
      />
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

function CompositionRails({
  props,
  coreItems,
  coreLoading,
  onRemoveExtra,
}: {
  props: ProductCompositionPanelProps;
  coreItems: CoreItemDto[];
  coreLoading: boolean;
  onRemoveExtra: (item: DeliveryFunctionOperationalDto) => void;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const hasExtras = props.extras.length > 0;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
      {hasExtras ? <CompositionBaseRule label={t('extraBadge')} /> : null}
      {hasExtras ? (
        <CompositionExtrasColumn
          extras={props.extras}
          showSalePrice={props.showSalePrice}
          salePriceByFunctionId={props.salePriceByFunctionId}
          unitsByFunctionId={props.canSeeUnits ? props.unitsByFunctionId : undefined}
          canRemove={!props.disabled && props.canAdd}
          onRemoveExtra={onRemoveExtra}
          volumeByFunctionId={props.volumeByFunctionId}
          volumeDisabled={props.disabled}
          onVolume={props.onFunctionVolume}
          onExtrasVolume={props.onExtrasVolume}
        />
      ) : null}
      {hasExtras ? <CompositionBaseRule label={t('baseHeading')} /> : null}
      <CompositionBaseBoard
        title={props.coreTitle}
        items={coreItems}
        included={props.included}
        loading={coreLoading}
        showSalePrice={props.showSalePrice}
        salePriceLabel={props.coreSalePriceLabel}
        productType={props.productType}
        volumeFactor={props.coreVolumeFactor}
        volumeDisabled={props.disabled}
        onVolume={props.onCoreVolume}
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
  canRemove,
  extras,
  onExtrasVolume,
  volumeDisabled,
  ...list
}: ComponentProps<typeof CompositionExtraList> & {
  onExtrasVolume?: (factor: string, reason: string | null) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {onExtrasVolume && extras.length > 0 ? (
        <div className={COMPOSITION_CONTROL_ROW_CLASS}>
          <VolumeFactorControl
            factor={VOLUME_FACTOR_STANDARD}
            disabled={volumeDisabled || !canRemove}
            onCommit={onExtrasVolume}
          />
        </div>
      ) : null}
      <CompositionExtraList
        extras={extras}
        canRemove={canRemove}
        volumeDisabled={volumeDisabled}
        {...list}
      />
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
  canReset,
  resetDisabled,
  onReset,
}: {
  title?: string;
  canAdd: boolean;
  disabled: boolean;
  blockedHint?: string | null;
  addLabel: string;
  onAdd: () => void;
  canReset: boolean;
  resetDisabled: boolean;
  onReset?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        {title ? (
          <h2 className="text-foreground min-w-0 text-lg font-semibold">{title}</h2>
        ) : (
          <span />
        )}
        <div className="flex shrink-0 items-center gap-2">
          {canReset && onReset ? (
            <ClearExtrasButton disabled={resetDisabled} onClear={onReset} />
          ) : null}
          {canAdd ? (
            <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onAdd}>
              <Plus size={COMPOSITION_ADD_ICON_SIZE_PX} />
              {addLabel}
            </Button>
          ) : null}
        </div>
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
