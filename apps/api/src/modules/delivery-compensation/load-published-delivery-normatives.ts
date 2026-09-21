import type {
  DeliveryCompensationRoleKey,
  DeliveryDesignMode,
  DeliveryRoleUnitKind,
} from '@nbos/shared';
import {
  DELIVERY_COMPENSATION_ROLE_KEYS,
  decimalToNullableString,
  pickPublishedAsOf,
  type DeliveryPlanFeatureInput,
  type DeliveryPlanRateInput,
  type DeliveryRoleUnitInput,
} from '@nbos/shared';

type DecimalLike = { toString(): string } | null;

export type NormativeRoleUnitRow = {
  roleKey: DeliveryCompensationRoleKey;
  unitKind: DeliveryRoleUnitKind;
  units: DecimalLike;
};

export type PublishedRateRow = {
  roleKey: DeliveryCompensationRoleKey;
  rate: DecimalLike;
  status: string;
  effectiveFrom: Date;
};

export type PublishedPriceVersionRow = {
  id: string;
  functionId: string;
  status: string;
  effectiveFrom: Date;
  roleUnits: NormativeRoleUnitRow[];
};

export type LoadPublishedNormativesInput = {
  asOf: Date;
  designMode: DeliveryDesignMode;
  aiDesignerReview: boolean;
  baseRoleUnits: NormativeRoleUnitRow[];
  rates: PublishedRateRow[];
  features: Array<{
    functionId: string;
    origin: 'INCLUDED' | 'EXTRA';
    selectedPriceVersionId: string | null;
  }>;
  extraPriceVersions: PublishedPriceVersionRow[];
};

export type LoadedPublishedNormatives = {
  designMode: DeliveryDesignMode;
  aiDesignerReview: boolean;
  baseRoleUnits: DeliveryRoleUnitInput[];
  rates: DeliveryPlanRateInput[];
  features: DeliveryPlanFeatureInput[];
};

export function toRoleUnitInputs(rows: readonly NormativeRoleUnitRow[]): DeliveryRoleUnitInput[] {
  const byRole = new Map(rows.map((row) => [row.roleKey, row]));
  return DELIVERY_COMPENSATION_ROLE_KEYS.map((roleKey) => {
    const row = byRole.get(roleKey);
    if (!row) {
      return { roleKey, unitKind: 'REQUIRED', units: null };
    }
    return {
      roleKey,
      unitKind: row.unitKind,
      units: decimalToNullableString(row.units),
    };
  });
}

export function loadPublishedDeliveryNormatives(
  input: LoadPublishedNormativesInput,
): LoadedPublishedNormatives {
  const rates: DeliveryPlanRateInput[] = DELIVERY_COMPENSATION_ROLE_KEYS.map((roleKey) => {
    const published = pickPublishedAsOf(
      input.rates.filter((row) => row.roleKey === roleKey),
      input.asOf,
    );
    return { roleKey, rate: decimalToNullableString(published?.rate ?? null) };
  });

  const extraByFunction = new Map<string, PublishedPriceVersionRow[]>();
  for (const version of input.extraPriceVersions) {
    const list = extraByFunction.get(version.functionId) ?? [];
    list.push(version);
    extraByFunction.set(version.functionId, list);
  }

  return {
    designMode: input.designMode,
    aiDesignerReview: input.aiDesignerReview,
    baseRoleUnits: toRoleUnitInputs(input.baseRoleUnits),
    rates,
    features: input.features.map((feature) => ({
      functionId: feature.functionId,
      origin: feature.origin,
      roleUnits: extraUnitsForFeature(
        feature,
        extraByFunction.get(feature.functionId) ?? [],
        input.asOf,
      ),
    })),
  };
}

function extraUnitsForFeature(
  feature: { origin: 'INCLUDED' | 'EXTRA'; selectedPriceVersionId: string | null },
  versions: readonly PublishedPriceVersionRow[],
  asOf: Date,
): DeliveryRoleUnitInput[] {
  if (feature.origin === 'INCLUDED') {
    return [];
  }
  const selected = feature.selectedPriceVersionId
    ? versions.find((row) => row.id === feature.selectedPriceVersionId)
    : null;
  const published = selected ?? pickPublishedAsOf(versions, asOf);
  return toRoleUnitInputs(published?.roleUnits ?? []);
}
