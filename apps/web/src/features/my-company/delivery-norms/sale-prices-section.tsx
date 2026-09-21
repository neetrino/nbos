'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryBaseProfileFinancialDto, DeliveryFunctionOperationalDto } from '@nbos/shared';
import type { SearchOption } from '@/components/shared';
import { COMPACT_PANEL_CLASS, OPTIONAL_SELECT_NONE } from './delivery-norms.constants';
import { DefaultUnitPriceForm } from './default-unit-price-form';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';
import { DeliveryNormsSectionToolbar } from './delivery-norms-section-toolbar';
import { dictionariesForProfileLabel, formatBaseProfileLabel } from './base-profile-label';
import { itemsMatchingSearch } from './matches-norm-search';
import { SalePriceCreateSheet } from './sale-price-create-sheet';
import {
  gradationsFromCatalog,
  groupSalePricesByKind,
  targetKeyForKind,
  type CatalogGradation,
  type SalePriceTargetKind,
} from './sale-price-draft';
import { SalePricesList } from './sale-prices-list';
import type { SalePriceVersionDto } from '@/lib/api/delivery-catalog-structure';

export function SalePricesSection({
  rows,
  catalog,
  profiles,
  defaultAmountPerUnit,
  canEdit,
  onChanged,
  onError,
  embedded = false,
}: {
  rows: SalePriceVersionDto[];
  catalog: DeliveryFunctionOperationalDto[];
  profiles: DeliveryBaseProfileFinancialDto[];
  defaultAmountPerUnit: string | null;
  canEdit: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
  embedded?: boolean;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<SalePriceTargetKind>('FUNCTION');
  const [targetId, setTargetId] = useState(OPTIONAL_SELECT_NONE);
  const labels = useMemo(
    () => targetLabelMap(catalog, profiles, gradationsFromCatalog(catalog), t),
    [catalog, profiles, t],
  );
  const kindLabels = {
    FUNCTION: t('salePrices.targetKinds.FUNCTION'),
    TIER: t('salePrices.targetKinds.TIER'),
    CORE: t('salePrices.targetKinds.CORE'),
  } as const;
  const options = useMemo(
    () => targetSearchOptions(kind, catalog, profiles, gradationsFromCatalog(catalog), labels),
    [catalog, kind, labels, profiles],
  );
  const filtered = useMemo(
    () =>
      itemsMatchingSearch(rows, query, (row) => [
        labels.get(row.targetKey) ?? row.targetKey,
        row.status,
        row.amountPerUnit ?? '',
        row.resolvedAmount ?? '',
      ]),
    [labels, query, rows],
  );
  const groups = useMemo(() => groupSalePricesByKind(filtered), [filtered]);

  return (
    <DeliveryNormsSectionCard
      title={embedded ? undefined : t('salePrices.title')}
      description={embedded ? undefined : t('salePrices.subtitle')}
    >
      <div className={COMPACT_PANEL_CLASS}>
        <DefaultUnitPriceForm
          key={defaultAmountPerUnit ?? 'none'}
          value={defaultAmountPerUnit}
          canEdit={canEdit}
          onChanged={onChanged}
          onError={onError}
        />
      </div>
      <DeliveryNormsSectionToolbar
        query={query}
        onQueryChange={setQuery}
        searchLabel={t('search.label')}
        searchPlaceholder={t('search.placeholder')}
        addLabel={t('add')}
        canAdd={canEdit}
        onAdd={() => setOpen(true)}
      />
      {canEdit ? (
        <SalePriceCreateSheet
          open={open}
          kind={kind}
          targetId={targetId}
          targetOptions={options}
          kindLabels={kindLabels}
          onOpenChange={setOpen}
          onKindChange={(next) => {
            setKind(next);
            setTargetId(OPTIONAL_SELECT_NONE);
          }}
          onTargetIdChange={setTargetId}
          onCreated={onChanged}
          onError={onError}
        />
      ) : null}
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('salePrices.allEmpty')}</p>
      ) : query.trim() !== '' && filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('search.empty')}</p>
      ) : (
        <SalePricesList
          groups={groups}
          labels={labels}
          kindLabels={kindLabels}
          canPublish={canEdit}
          onPublished={onChanged}
          onError={onError}
        />
      )}
    </DeliveryNormsSectionCard>
  );
}

function targetSearchOptions(
  kind: SalePriceTargetKind,
  catalog: DeliveryFunctionOperationalDto[],
  profiles: DeliveryBaseProfileFinancialDto[],
  gradations: CatalogGradation[],
  labels: Map<string, string>,
): SearchOption[] {
  if (kind === 'FUNCTION') {
    return catalog.map((item) => ({
      value: item.id,
      label: labels.get(targetKeyForKind('FUNCTION', item.id)) ?? item.title,
      subtitle: item.code,
    }));
  }
  if (kind === 'CORE') {
    return profiles.map((row) => ({
      value: row.id,
      label: labels.get(targetKeyForKind('CORE', row.id)) ?? row.profileKey,
    }));
  }
  return gradations.map((tier) => ({
    value: tier.id,
    label: labels.get(targetKeyForKind('TIER', tier.id)) ?? tier.label,
  }));
}

function targetLabelMap(
  catalog: DeliveryFunctionOperationalDto[],
  profiles: DeliveryBaseProfileFinancialDto[],
  gradations: CatalogGradation[],
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): Map<string, string> {
  const dictionaries = dictionariesForProfileLabel(t);
  const entries: Array<[string, string]> = [
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
  ];
  return new Map(entries);
}
