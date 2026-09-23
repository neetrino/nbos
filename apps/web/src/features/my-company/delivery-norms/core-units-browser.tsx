'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  sumPayableRoleUnits,
  type DeliveryBaseProfileFinancialDto,
  type ProductTypeKey,
} from '@nbos/shared';
import type { SalePriceVersionDto } from '@/lib/api/delivery-catalog-structure';
import { formatMoneyDram } from '@/lib/format/money';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { coreCardIncludedCount, coreCardSaleAmount, coreCardSource } from './core-card-meta';
import {
  CORE_RAIL_ALL_ID,
  buildCoreRailEntries,
  coreKindGroupId,
  isCoreRailId,
  visibleCoreGroupIds,
  type CoreRailId,
} from './core-kind-groups';
import type { CoreUnitSlot } from './core-unit-slots';
import { formatUnitSum, UNIT_SUM_EMPTY } from './format-unit-sum';
import { itemsMatchingSearch } from './matches-norm-search';
import { liveNormDisplayStatus, liveNormPair } from './live-norm-pair';
import { NormsCatalogCard } from './norms-catalog-card';
import { NormsCategoryBrowser } from './norms-category-browser';
import { normativeStatusLabelKey } from './normative-status-badge';
import { PublishDraftButton } from './publish-draft-button';

const GROUP_MESSAGE_KEYS = {
  all: 'cores.groups.all',
  sites: 'cores.groups.sites',
  commerce: 'cores.groups.commerce',
  operations: 'cores.groups.operations',
  portals: 'cores.groups.portals',
  marketing: 'cores.groups.marketing',
  other: 'cores.groups.other',
} as const satisfies Record<CoreRailId, `cores.groups.${CoreRailId}`>;

export function CoreUnitsBrowser({
  slots,
  labels,
  salePrices,
  canAdd,
  canPublish,
  onOpen,
  onChanged,
  onError,
}: {
  slots: CoreUnitSlot[];
  labels: Record<ProductTypeKey, string>;
  salePrices: readonly SalePriceVersionDto[];
  canAdd: boolean;
  canPublish: boolean;
  onOpen: (productType: string) => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const view = useCoreUnitsView(slots, labels);
  return (
    <NormsCategoryBrowser
      railTitle={view.railTitle}
      entries={view.entries}
      selectedId={view.category}
      onSelect={view.selectCategory}
      search={view.query}
      onSearchChange={view.setQuery}
      searchPlaceholder={view.searchPlaceholder}
      blocks={view.blocks}
      emptyLabel={view.emptyLabel}
      itemKey={(slot) => slot.productType}
      renderItem={(slot) => (
        <CoreKindCard
          slot={slot}
          title={kindTitle(labels, slot.productType)}
          salePrices={salePrices}
          canAdd={canAdd}
          canPublish={canPublish}
          unitsLabel={view.unitsLabel(slot)}
          onOpen={() => onOpen(slot.productType)}
          onChanged={onChanged}
          onError={onError}
        />
      )}
    />
  );
}

function useCoreUnitsView(slots: CoreUnitSlot[], labels: Record<ProductTypeKey, string>) {
  const t = useTranslations('hr.deliveryNorms');
  const tCatalog = useTranslations('hr.functionCatalog');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CoreRailId>(CORE_RAIL_ALL_ID);
  const filtered = useMemo(
    () =>
      itemsMatchingSearch(slots, query, (slot) => [
        kindTitle(labels, slot.productType),
        slot.productType,
      ]),
    [labels, query, slots],
  );
  const types = filtered.map((slot) => slot.productType);
  return {
    railTitle: tCatalog('categoriesRail'),
    entries: buildCoreRailEntries(types).map((entry) => ({
      ...entry,
      label: t(GROUP_MESSAGE_KEYS[entry.id]),
    })),
    category,
    selectCategory: (id: string) => {
      if (isCoreRailId(id)) setCategory(id);
    },
    query,
    setQuery,
    searchPlaceholder: t('cores.searchPlaceholder'),
    blocks: coreBlocks(filtered, category, t),
    emptyLabel: t('search.empty'),
    unitsLabel: (slot: CoreUnitSlot) =>
      coreUnitsLabel(slot, (count) => tCatalog('unitsCount', { count })),
  };
}

function kindTitle(labels: Record<ProductTypeKey, string>, productType: string): string {
  return (labels as Record<string, string | undefined>)[productType] ?? productType;
}

function coreBlocks(
  slots: CoreUnitSlot[],
  category: CoreRailId,
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
) {
  return visibleCoreGroupIds(
    slots.map((slot) => slot.productType),
    category,
  ).map((id) => ({
    id,
    label: t(GROUP_MESSAGE_KEYS[id]),
    items: slots.filter((slot) => coreKindGroupId(slot.productType) === id),
  }));
}

function coreUnitsLabel(slot: CoreUnitSlot, formatCount: (count: number) => string): string {
  const pair = liveNormPair(slot.productType, slot.rows);
  const current = pair.draft ?? pair.published;
  const total = current ? sumPayableRoleUnits(current.roleUnits) : null;
  if (total === null) return UNIT_SUM_EMPTY;
  const formatted = formatUnitSum(total);
  if (!/^\d+$/u.test(formatted)) return formatted;
  return formatCount(Number(formatted));
}

function CoreKindCard({
  slot,
  title,
  salePrices,
  canAdd,
  canPublish,
  unitsLabel,
  onOpen,
  onChanged,
  onError,
}: {
  slot: CoreUnitSlot;
  title: string;
  salePrices: readonly SalePriceVersionDto[];
  canAdd: boolean;
  canPublish: boolean;
  unitsLabel: string;
  onOpen: () => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const pair = liveNormPair(slot.productType, slot.rows);
  const current = coreCardSource(slot);
  const status = current ? liveNormDisplayStatus(pair) : null;
  const saleAmount = coreCardSaleAmount(slot, salePrices);
  const includedCount = current ? coreCardIncludedCount(slot) : null;
  return (
    <NormsCatalogCard
      title={title}
      unitsLabel={unitsLabel}
      salePriceLabel={saleAmount ? formatMoneyDram(Number(saleAmount)) : null}
      includedLabel={
        includedCount === null ? null : t('profiles.includedCount', { count: includedCount })
      }
      status={status}
      statusLabel={status ? t(normativeStatusLabelKey(status)) : null}
      canOpen={pair.draft ? canPublish : canAdd}
      onOpen={onOpen}
      publish={corePublishAction(pair.draft, canPublish, onChanged, onError)}
    />
  );
}

function corePublishAction(
  draft: DeliveryBaseProfileFinancialDto | null,
  canPublish: boolean,
  onChanged: () => void,
  onError: (message: string) => void,
) {
  if (!draft || !canPublish) return null;
  return (
    <PublishDraftButton
      roleUnits={draft.roleUnits}
      onPublish={async (confirmZeroUnits) => {
        await deliveryNormsApi.publishBaseProfile(draft.id, { confirmZeroUnits });
      }}
      onError={onError}
      onPublished={onChanged}
    />
  );
}
