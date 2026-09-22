'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  productTypesOfferedForNewProduct,
  type DeliveryBaseProfileFinancialDto,
  type DeliveryFunctionOperationalDto,
} from '@nbos/shared';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { coreUnitSlots } from './core-unit-slots';
import { CoreUnitSheet } from './core-unit-sheet';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';
import { DeliveryNormsSectionToolbar } from './delivery-norms-section-toolbar';
import { NORMS_CARD_GRID_CLASS } from './delivery-norms.constants';
import { parseProfileKey } from './base-profile-label';
import { liveNormDisplayStatus, liveNormPair } from './live-norm-pair';
import { itemsMatchingSearch } from './matches-norm-search';
import { normativeStatusLabelKey } from './normative-status-badge';
import { productTypeLabels } from './profile-enum-labels';
import { PublishDraftButton } from './publish-draft-button';
import { UnitNormCard } from './unit-norm-card';

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
  const list = useCoreUnitList(props.rows, t);
  return (
    <DeliveryNormsSectionCard>
      <DeliveryNormsSectionToolbar
        query={list.query}
        onQueryChange={list.setQuery}
        searchLabel={t('search.label')}
        searchPlaceholder={t('search.placeholder')}
      />
      {list.query.trim() !== '' && list.slots.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('search.empty')}</p>
      ) : (
        <CoreUnitGrid {...props} slots={list.slots} labels={list.labels} />
      )}
    </DeliveryNormsSectionCard>
  );
}

function useCoreUnitList(
  rows: DeliveryBaseProfileFinancialDto[],
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
) {
  const [query, setQuery] = useState('');
  const labels = useMemo(() => productTypeLabels(t), [t]);
  const slots = useMemo(
    () =>
      itemsMatchingSearch(
        coreUnitSlots(productTypesOfferedForNewProduct(), rowsWithProductType(rows)),
        query,
        (slot) => [
          labels[slot.productType as keyof typeof labels] ?? slot.productType,
          slot.productType,
        ],
      ),
    [labels, query, rows],
  );
  return { query, setQuery, labels, slots };
}

function CoreUnitGrid({
  slots,
  labels,
  catalog,
  canAdd,
  canPublish,
  onChanged,
  onError,
}: CoreUnitsSectionProps & {
  slots: ReturnType<typeof coreUnitSlots>;
  labels: ReturnType<typeof productTypeLabels>;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [openType, setOpenType] = useState<string | null>(null);
  return (
    <>
      <ul className={NORMS_CARD_GRID_CLASS}>
        {slots.map((slot) => (
          <CoreUnitGridCard
            key={slot.productType}
            slot={slot}
            title={labels[slot.productType as keyof typeof labels] ?? slot.productType}
            kindLabel={t('workspace.unitTabs.core')}
            canAdd={canAdd}
            canPublish={canPublish}
            onOpen={() => setOpenType(slot.productType)}
            onChanged={onChanged}
            onError={onError}
          />
        ))}
      </ul>
      <CoreUnitSheetHost
        openType={openType}
        slots={slots}
        labels={labels}
        catalog={catalog}
        canAdd={canAdd}
        canPublish={canPublish}
        onClose={() => setOpenType(null)}
        onChanged={onChanged}
        onError={onError}
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
  labels: ReturnType<typeof productTypeLabels>;
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
      title={labels[openType as keyof typeof labels] ?? openType}
      pair={openPair}
      catalog={catalog}
      canSave={canSaveCore(openPair, canAdd, canPublish)}
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

function CoreUnitGridCard({
  slot,
  title,
  kindLabel,
  canAdd,
  canPublish,
  onOpen,
  onChanged,
  onError,
}: {
  slot: ReturnType<typeof coreUnitSlots>[number];
  title: string;
  kindLabel: string;
  canAdd: boolean;
  canPublish: boolean;
  onOpen: () => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const pair = liveNormPair(slot.productType, slot.rows);
  const current = pair.draft ?? pair.published;
  const status = current ? liveNormDisplayStatus(pair) : null;
  return (
    <UnitNormCard
      title={title}
      kindLabel={kindLabel}
      roleUnits={current?.roleUnits ?? null}
      status={status}
      statusLabel={status ? t(normativeStatusLabelKey(status)) : null}
      canOpen={canSaveCore(pair, canAdd, canPublish)}
      onOpen={onOpen}
      publish={
        pair.draft && canPublish ? (
          <PublishDraftButton
            roleUnits={pair.draft.roleUnits}
            onPublish={async (confirmZeroUnits) => {
              await deliveryNormsApi.publishBaseProfile(pair.draft?.id ?? '', { confirmZeroUnits });
            }}
            onError={onError}
            onPublished={onChanged}
          />
        ) : null
      }
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

function canSaveCore(
  pair: ReturnType<typeof liveNormPair<DeliveryBaseProfileFinancialDto>> | null,
  canAdd: boolean,
  canPublish: boolean,
): boolean {
  if (pair?.draft) return canPublish;
  return canAdd;
}
