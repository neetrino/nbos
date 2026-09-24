import {
  DELIVERY_COMPENSATION_ROLE_KEYS,
  type DeliveryCompensationErrorCode,
  type DeliveryCompensationRoleKey,
  type DeliveryFeatureOrigin,
} from './constants';
import { unitsTimesRate, sumMoney } from './decimal-scale';
import { scaleUnits, VOLUME_FACTOR_STANDARD } from './volume-factor';
import {
  findUnconfiguredRequiredRoles,
  roleKindPaysUnits,
  type DeliveryRoleUnitInput,
} from './role-units';

export type DeliveryPlanRateInput = {
  roleKey: DeliveryCompensationRoleKey;
  rate: string | null;
};

export type DeliveryPlanFeatureInput = {
  functionId: string;
  origin: DeliveryFeatureOrigin;
  roleUnits: DeliveryRoleUnitInput[];
  /** Instance effort on an extra line. Included lines ignore it. Defaults to ×1.0. */
  volumeFactor?: string;
};

export type FrozenComponentInput = {
  componentKey: string;
  roleKey: DeliveryCompensationRoleKey;
  units: string;
  rate: string;
  amount: string;
};

export type DeliveryPlanLine = {
  componentKey: string;
  roleKey: DeliveryCompensationRoleKey;
  units: string;
  rate: string;
  amount: string;
};

export type CalculateDeliveryPlanInput = {
  baseRoleUnits: DeliveryRoleUnitInput[];
  /** Instance effort on the core. Defaults to ×1.0. */
  baseVolumeFactor?: string;
  rates: DeliveryPlanRateInput[];
  features: DeliveryPlanFeatureInput[];
  frozenComponents?: FrozenComponentInput[];
};

export type CalculateDeliveryPlanResult = {
  ok: boolean;
  errors: DeliveryCompensationErrorCode[];
  lines: DeliveryPlanLine[];
  visibleIncludedFunctionIds: string[];
  totalsByRole: Record<DeliveryCompensationRoleKey, string>;
  total: string;
};

function emptyTotals(): Record<DeliveryCompensationRoleKey, string> {
  return {
    BACKEND: '0.00',
    FRONTEND: '0.00',
    PM: '0.00',
    DESIGNER: '0.00',
    QA: '0.00',
    TECHNICAL_SPECIALIST: '0.00',
  };
}

function rateByRole(rates: readonly DeliveryPlanRateInput[]) {
  return new Map(rates.map((row) => [row.roleKey, row.rate]));
}

function collectConfigErrors(
  rows: readonly DeliveryRoleUnitInput[],
  rates: Map<DeliveryCompensationRoleKey, string | null>,
): DeliveryCompensationErrorCode[] {
  const errors: DeliveryCompensationErrorCode[] = [];
  if (findUnconfiguredRequiredRoles(rows).length > 0) {
    errors.push('UNITS_NOT_CONFIGURED');
  }
  for (const row of rows) {
    if (!roleKindPaysUnits(row.unitKind) || row.units === null) {
      continue;
    }
    if (!rates.has(row.roleKey) || rates.get(row.roleKey) === null) {
      errors.push('RATE_NOT_CONFIGURED');
      break;
    }
  }
  return errors;
}

function scaleRoleUnits(
  rows: readonly DeliveryRoleUnitInput[],
  factor: string | undefined,
): DeliveryRoleUnitInput[] {
  const applied = factor ?? VOLUME_FACTOR_STANDARD;
  if (applied === VOLUME_FACTOR_STANDARD) {
    return [...rows];
  }
  return rows.map((row) => ({
    ...row,
    units: row.units === null ? null : scaleUnits(row.units, applied),
  }));
}

function linesForVector(
  componentKey: string,
  rows: readonly DeliveryRoleUnitInput[],
  rates: Map<DeliveryCompensationRoleKey, string | null>,
): DeliveryPlanLine[] {
  const lines: DeliveryPlanLine[] = [];
  for (const row of rows) {
    if (!roleKindPaysUnits(row.unitKind) || row.units === null) {
      continue;
    }
    const rate = rates.get(row.roleKey);
    if (rate === null || rate === undefined) {
      continue;
    }
    lines.push({
      componentKey,
      roleKey: row.roleKey,
      units: row.units,
      rate,
      amount: unitsTimesRate(row.units, rate),
    });
  }
  return lines;
}

export function calculateDeliveryPlan(
  input: CalculateDeliveryPlanInput,
): CalculateDeliveryPlanResult {
  const rates = rateByRole(input.rates);
  const uniqueErrors = [...new Set(collectPlanErrors(input, rates))];
  const lines = buildPlanLines(input, rates, uniqueErrors.length === 0);
  const totalsByRole = totalsFor(lines);
  return {
    ok: uniqueErrors.length === 0,
    errors: uniqueErrors,
    lines,
    visibleIncludedFunctionIds: input.features
      .filter((feature) => feature.origin === 'INCLUDED')
      .map((feature) => feature.functionId),
    totalsByRole,
    total: sumMoney(Object.values(totalsByRole)),
  };
}

function collectPlanErrors(
  input: CalculateDeliveryPlanInput,
  rates: Map<DeliveryCompensationRoleKey, string | null>,
): DeliveryCompensationErrorCode[] {
  const errors = collectConfigErrors(input.baseRoleUnits, rates);
  for (const feature of input.features) {
    if (feature.origin === 'INCLUDED') continue;
    errors.push(...collectConfigErrors(feature.roleUnits, rates));
  }
  return errors;
}

function buildPlanLines(
  input: CalculateDeliveryPlanInput,
  rates: Map<DeliveryCompensationRoleKey, string | null>,
  valid: boolean,
): DeliveryPlanLine[] {
  const lines: DeliveryPlanLine[] = [];
  if (valid) {
    lines.push(
      ...linesForVector('BASE', scaleRoleUnits(input.baseRoleUnits, input.baseVolumeFactor), rates),
    );
    for (const feature of payableFeatures(input)) {
      lines.push(
        ...linesForVector(
          `FEATURE:${feature.functionId}`,
          scaleRoleUnits(feature.roleUnits, feature.volumeFactor),
          rates,
        ),
      );
    }
  }
  for (const frozen of input.frozenComponents ?? []) {
    lines.push({
      componentKey: frozen.componentKey,
      roleKey: frozen.roleKey,
      units: frozen.units,
      rate: frozen.rate,
      amount: frozen.amount,
    });
  }
  return lines;
}

function payableFeatures(
  input: CalculateDeliveryPlanInput,
): CalculateDeliveryPlanInput['features'] {
  return input.features.filter((feature) => feature.origin !== 'INCLUDED');
}

function totalsFor(
  lines: readonly DeliveryPlanLine[],
): Record<DeliveryCompensationRoleKey, string> {
  const totalsByRole = emptyTotals();
  for (const role of DELIVERY_COMPENSATION_ROLE_KEYS) {
    totalsByRole[role] = sumMoney(
      lines.filter((line) => line.roleKey === role).map((line) => line.amount),
    );
  }
  return totalsByRole;
}
