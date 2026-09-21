'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryBaseProfileFinancialDto, DeliveryFunctionOperationalDto } from '@nbos/shared';
import type { SalePriceVersionDto } from '@/lib/api/delivery-catalog-structure';
import { DefaultMultiplierForm } from './default-multiplier-form';
import {
  OPTIONAL_SELECT_NONE,
  SALE_PRICE_TARGET_KINDS,
  type SalePriceTargetKind,
} from './delivery-norms.constants';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';
import { NormEnumSelect } from './norm-enum-select';
import { NormField } from './norm-field';
import { SalePriceCreateForm } from './sale-price-create-form';
import {
  gradationsFromCatalog,
  salePricesForTarget,
  targetKeyForKind,
  type CatalogGradation,
} from './sale-price-draft';
import { SalePricesList } from './sale-prices-list';

export function SalePricesSection({
  rows,
  catalog,
  profiles,
  defaultMultiplier,
  canEdit,
  onChanged,
  onError,
  embedded = false,
}: {
  rows: SalePriceVersionDto[];
  catalog: DeliveryFunctionOperationalDto[];
  profiles: DeliveryBaseProfileFinancialDto[];
  defaultMultiplier: string | null;
  canEdit: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
  embedded?: boolean;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [kind, setKind] = useState<SalePriceTargetKind>('FUNCTION');
  const [targetId, setTargetId] = useState(OPTIONAL_SELECT_NONE);
  const targetKey = targetId === OPTIONAL_SELECT_NONE ? null : targetKeyForKind(kind, targetId);
  const versions = salePricesForTarget(rows, targetKey);

  return (
    <DeliveryNormsSectionCard
      title={embedded ? undefined : t('salePrices.title')}
      description={embedded ? undefined : t('salePrices.subtitle')}
    >
      <DefaultMultiplierForm
        key={defaultMultiplier ?? 'none'}
        value={defaultMultiplier}
        canEdit={canEdit}
        onChanged={onChanged}
        onError={onError}
      />
      <SalePriceTargetPicker
        kind={kind}
        targetId={targetId}
        catalog={catalog}
        profiles={profiles}
        gradations={gradationsFromCatalog(catalog)}
        onKindChange={(next) => {
          setKind(next);
          setTargetId(OPTIONAL_SELECT_NONE);
        }}
        onTargetIdChange={setTargetId}
      />
      {canEdit ? (
        <SalePriceCreateForm
          kind={kind}
          targetId={targetId}
          onCreated={onChanged}
          onError={onError}
        />
      ) : null}
      <SalePricesList
        rows={versions}
        canPublish={canEdit}
        onPublished={onChanged}
        onError={onError}
      />
    </DeliveryNormsSectionCard>
  );
}

function SalePriceTargetPicker({
  kind,
  targetId,
  catalog,
  profiles,
  gradations,
  onKindChange,
  onTargetIdChange,
}: {
  kind: SalePriceTargetKind;
  targetId: string;
  catalog: DeliveryFunctionOperationalDto[];
  profiles: DeliveryBaseProfileFinancialDto[];
  gradations: CatalogGradation[];
  onKindChange: (kind: SalePriceTargetKind) => void;
  onTargetIdChange: (id: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const kindLabels = {
    FUNCTION: t('salePrices.targetKinds.FUNCTION'),
    TIER: t('salePrices.targetKinds.TIER'),
    CORE: t('salePrices.targetKinds.CORE'),
  } as const;
  const options = useMemo(
    () => targetOptions(kind, catalog, profiles, gradations),
    [kind, catalog, profiles, gradations],
  );
  const labels = targetOptionLabels(kind, options, catalog, profiles, gradations, t);

  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <NormField label={t('salePrices.targetKind')}>
          <NormEnumSelect
            id="sale-price-kind"
            value={kind}
            options={SALE_PRICE_TARGET_KINDS}
            labels={kindLabels}
            onChange={onKindChange}
          />
        </NormField>
        <NormField label={t('salePrices.pickTarget')}>
          <NormEnumSelect
            id="sale-price-target"
            value={targetId}
            options={[OPTIONAL_SELECT_NONE, ...options]}
            labels={labels}
            onChange={onTargetIdChange}
          />
        </NormField>
      </div>
      {kind === 'TIER' && options.length === 0 ? (
        <p className="text-muted-foreground text-xs">{t('salePrices.noTiers')}</p>
      ) : null}
    </div>
  );
}

function targetOptions(
  kind: SalePriceTargetKind,
  catalog: DeliveryFunctionOperationalDto[],
  profiles: DeliveryBaseProfileFinancialDto[],
  gradations: readonly CatalogGradation[],
): string[] {
  if (kind === 'FUNCTION') {
    return catalog.map((item) => item.id);
  }
  if (kind === 'CORE') {
    return profiles.map((row) => row.id);
  }
  return gradations.map((tier) => tier.id);
}

function targetOptionLabels(
  kind: SalePriceTargetKind,
  options: readonly string[],
  catalog: DeliveryFunctionOperationalDto[],
  profiles: DeliveryBaseProfileFinancialDto[],
  gradations: readonly CatalogGradation[],
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): Record<string, string> {
  const functions = new Map<string, string>([
    ...catalog.map((item) => [item.id, item.title] as const),
    ...gradations.map((tier) => [tier.id, tier.label] as const),
  ]);
  const cores = new Map(
    profiles.map(
      (row) => [`${row.id}`, `${row.profileKey} · ${t('columns.version')} ${row.version}`] as const,
    ),
  );
  const entries: Array<[string, string]> = [
    [OPTIONAL_SELECT_NONE, pickerPlaceholder(kind, t)],
    ...options.map((id) => [id, labelForTarget(kind, id, functions, cores, t)] as [string, string]),
  ];
  return Object.fromEntries(entries);
}

function pickerPlaceholder(
  kind: SalePriceTargetKind,
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): string {
  if (kind === 'FUNCTION') {
    return t('salePrices.pickFunction');
  }
  if (kind === 'CORE') {
    return t('salePrices.pickCore');
  }
  return t('salePrices.pickTier');
}

function labelForTarget(
  kind: SalePriceTargetKind,
  id: string,
  functions: Map<string, string>,
  cores: Map<string, string>,
  t: ReturnType<typeof useTranslations<'hr.deliveryNorms'>>,
): string {
  if (kind === 'FUNCTION') {
    return functions.get(id) ?? t('salePrices.unknownTarget');
  }
  if (kind === 'CORE') {
    return cores.get(id) ?? t('salePrices.unknownTarget');
  }
  return id;
}
