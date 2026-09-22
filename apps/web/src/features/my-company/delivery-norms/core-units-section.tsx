'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  productTypesOfferedForNewProduct,
  type DeliveryBaseProfileFinancialDto,
  type DeliveryFunctionOperationalDto,
} from '@nbos/shared';
import { parseProfileKey } from './base-profile-label';
import { coreUnitSlots } from './core-unit-slots';
import { CoreUnitSheet } from './core-unit-sheet';
import { CoreUnitsBrowser } from './core-units-browser';
import { liveNormPair } from './live-norm-pair';
import { productTypeLabels } from './profile-enum-labels';

type ProductTypeLabelMap = ReturnType<typeof productTypeLabels>;

type CoreUnitsSectionProps = {
  rows: DeliveryBaseProfileFinancialDto[];
  catalog: DeliveryFunctionOperationalDto[];
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
};

export function CoreUnitsSection(props: CoreUnitsSectionProps) {
  const t = useTranslations('hr.deliveryNorms');
  const labels = useMemo(() => productTypeLabels(t), [t]);
  const slots = useMemo(
    () => coreUnitSlots(productTypesOfferedForNewProduct(), rowsWithProductType(props.rows)),
    [props.rows],
  );
  const [openType, setOpenType] = useState<string | null>(null);
  return (
    <>
      <CoreUnitsBrowser
        slots={slots}
        labels={labels}
        canAdd={props.canAdd}
        canPublish={props.canPublish}
        onOpen={setOpenType}
        onChanged={props.onChanged}
        onError={props.onError}
      />
      <CoreUnitSheetHost
        openType={openType}
        slots={slots}
        labels={labels}
        catalog={props.catalog}
        canAdd={props.canAdd}
        canPublish={props.canPublish}
        onClose={() => setOpenType(null)}
        onChanged={props.onChanged}
        onError={props.onError}
      />
    </>
  );
}

function CoreUnitSheetHost({
  openType,
  slots,
  labels,
  catalog,
  canAdd,
  canPublish,
  onClose,
  onChanged,
  onError,
}: {
  openType: string | null;
  slots: ReturnType<typeof coreUnitSlots>;
  labels: ProductTypeLabelMap;
  catalog: DeliveryFunctionOperationalDto[];
  canAdd: boolean;
  canPublish: boolean;
  onClose: () => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  if (!openType) return null;
  const openSlot = slots.find((slot) => slot.productType === openType) ?? null;
  const openPair = openSlot ? liveNormPair(openSlot.productType, openSlot.rows) : null;
  return (
    <CoreUnitSheet
      open
      productType={openType}
      title={labels[openType as keyof ProductTypeLabelMap] ?? openType}
      pair={openPair}
      catalog={catalog}
      canSave={openPair?.draft ? canPublish : canAdd}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      onSaved={() => {
        onClose();
        onChanged();
      }}
      onError={onError}
    />
  );
}

function rowsWithProductType(
  rows: readonly DeliveryBaseProfileFinancialDto[],
): DeliveryBaseProfileFinancialDto[] {
  return rows.map((row) => ({
    ...row,
    productType: row.productType ?? parseProfileKey(row.profileKey).productType,
  }));
}
