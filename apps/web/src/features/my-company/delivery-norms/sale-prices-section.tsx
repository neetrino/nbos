'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type {
  DeliveryBaseProfileFinancialDto,
  DeliveryFunctionOperationalDto,
  DeliveryFunctionPriceFinancialDto,
} from '@nbos/shared';
import { PageHeroTabs, type PageHeroTabOption } from '@/components/shared';
import type { SalePriceVersionDto } from '@/lib/api/delivery-catalog-structure';
import { dictionariesForProfileLabel, formatBaseProfileLabel } from './base-profile-label';
import { type SalePriceTargetKind } from './delivery-norms.constants';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';
import { DeliveryNormsSectionToolbar } from './delivery-norms-section-toolbar';
import { displayedSaleAmount, liveSalePrices } from './live-sale-prices';
import { itemsMatchingSearch } from './matches-norm-search';
import { gradationsFromCatalog, targetKeyForKind, type CatalogGradation } from './sale-price-draft';
import { SalePricesTable } from './sale-prices-table';
import { saleUnitTotals } from './sale-price-units';

const SALE_TABS = ['CORE', 'FUNCTION', 'TIER'] as const;

type SalePricesSectionProps = {
  rows: SalePriceVersionDto[];
  prices: DeliveryFunctionPriceFinancialDto[];
  catalog: DeliveryFunctionOperationalDto[];
  profiles: DeliveryBaseProfileFinancialDto[];
  canEdit: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
  embedded?: boolean;
};

export function SalePricesSection({
  rows,
  prices,
  catalog,
  profiles,
  canEdit,
  onChanged,
  onError,
  embedded = false,
}: SalePricesSectionProps) {
  const t = useTranslations('hr.deliveryNorms');
  const workspace = useSalePricesWorkspace(rows, prices, catalog, profiles);
  return (
    <DeliveryNormsSectionCard
      title={embedded ? undefined : t('salePrices.title')}
      description={embedded ? undefined : t('salePrices.subtitle')}
    >
      <SalePricesChrome workspace={workspace} />
      {workspace.query.trim() !== '' && workspace.filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('search.empty')}</p>
      ) : (
        <SalePricesTable
          pairs={workspace.filtered}
          labels={workspace.labels}
          unitTotals={workspace.unitTotals}
          canPublish={canEdit}
          onChanged={onChanged}
          onError={onError}
        />
      )}
    </DeliveryNormsSectionCard>
  );
}

function useSalePricesWorkspace(
  rows: SalePriceVersionDto[],
  prices: DeliveryFunctionPriceFinancialDto[],
  catalog: DeliveryFunctionOperationalDto[],
  profiles: DeliveryBaseProfileFinancialDto[],
) {
  const t = useTranslations('hr.deliveryNorms');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<SalePriceTargetKind>('CORE');
  const labels = useMemo(
    () => targetLabelMap(catalog, profiles, gradationsFromCatalog(catalog), t),
    [catalog, profiles, t],
  );
  const knownKeys = useMemo(
    () => knownSaleTargetKeys(kind, catalog, profiles, gradationsFromCatalog(catalog)),
    [catalog, kind, profiles],
  );
  const tabs = useMemo(
    (): PageHeroTabOption<SalePriceTargetKind>[] =>
      SALE_TABS.map((value) => ({
        value,
        label: t(`salePrices.targetKinds.${value}`),
      })),
    [t],
  );
  const unitTotals = useMemo(
    () => saleUnitTotals(kind, prices, profiles),
    [kind, prices, profiles],
  );
  const pairs = useMemo(() => liveSalePrices(rows, kind, knownKeys), [kind, knownKeys, rows]);
  const filtered = useMemo(() => matchingSalePrices(pairs, query, labels), [labels, pairs, query]);
  return { query, kind, labels, unitTotals, tabs, filtered, setQuery, setKind };
}

type SalePricesWorkspace = ReturnType<typeof useSalePricesWorkspace>;

function matchingSalePrices(
  pairs: ReturnType<typeof liveSalePrices>,
  query: string,
  labels: Map<string, string>,
) {
  return itemsMatchingSearch(pairs, query, (pair) => [
    labels.get(pair.targetKey) ?? pair.targetKey,
    displayedSaleAmount(pair) ?? '',
    pair.draft?.status ?? pair.published?.status ?? '',
  ]);
}

function SalePricesChrome({ workspace }: { workspace: SalePricesWorkspace }) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <>
      <PageHeroTabs
        value={workspace.kind}
        onChange={workspace.setKind}
        options={workspace.tabs}
        ariaLabel={t('workspace.saleTabs.aria')}
        showOnMobile
        registerMobileDock={false}
      />
      <DeliveryNormsSectionToolbar
        query={workspace.query}
        onQueryChange={workspace.setQuery}
        searchLabel={t('search.label')}
        searchPlaceholder={t('search.placeholder')}
      />
    </>
  );
}

function knownSaleTargetKeys(
  kind: SalePriceTargetKind,
  catalog: DeliveryFunctionOperationalDto[],
  profiles: DeliveryBaseProfileFinancialDto[],
  gradations: CatalogGradation[],
): string[] {
  if (kind === 'FUNCTION') {
    return catalog.map((item) => targetKeyForKind('FUNCTION', item.id));
  }
  if (kind === 'CORE') {
    return profiles.map((row) => targetKeyForKind('CORE', row.id));
  }
  return gradations.map((tier) => targetKeyForKind('TIER', tier.id));
}

function targetLabelMap(
  catalog: DeliveryFunctionOperationalDto[],
  profiles: DeliveryBaseProfileFinancialDto[],
  gradations: CatalogGradation[],
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): Map<string, string> {
  const dictionaries = dictionariesForProfileLabel(t);
  return new Map([
    ...catalog.map(
      (item) => [targetKeyForKind('FUNCTION', item.id), item.title] as [string, string],
    ),
    ...gradations.map(
      (tier) => [targetKeyForKind('TIER', tier.id), tier.label] as [string, string],
    ),
    ...profiles.map(
      (row) =>
        [
          targetKeyForKind('CORE', row.id),
          formatBaseProfileLabel(row.profileKey, row.version, dictionaries),
        ] as [string, string],
    ),
  ]);
}
