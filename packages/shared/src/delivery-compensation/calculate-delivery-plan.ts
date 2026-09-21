import {
  DELIVERY_COMPENSATION_ROLE_KEYS,
  type DeliveryCompensationErrorCode,
  type DeliveryCompensationRoleKey,
  type DeliveryFeatureOrigin,
} from './constants';
import { unitsTimesRate, sumMoney } from './decimal-scale';
import { findUnconfiguredRequiredRoles, type DeliveryRoleUnitInput } from './role-units';
import {
  validateDesignModeAssignment,
  type DesignModeAssignmentInput,
} from './validate-design-mode';

export type DeliveryPlanRateInput = {
  roleKey: DeliveryCompensationRoleKey;
  rate: string | null;
};

export type DeliveryPlanFeatureInput = {
  functionId: string;
  origin: DeliveryFeatureOrigin;
  roleUnits: DeliveryRoleUnitInput[];
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

export type CalculateDeliveryPlanInput = DesignModeAssignmentInput & {
  baseRoleUnits: DeliveryRoleUnitInput[];
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
    if (row.unitKind === 'NOT_REQUIRED') {
      continue;
    }
    if (row.units === null) {
      continue;
    }
    if (!rates.has(row.roleKey) || rates.get(row.roleKey) === null) {
      errors.push('RATE_NOT_CONFIGURED');
      break;
    }
  }
  return errors;
}

function linesForVector(
  componentKey: string,
  rows: readonly DeliveryRoleUnitInput[],
  rates: Map<DeliveryCompensationRoleKey, string | null>,
): DeliveryPlanLine[] {
  const lines: DeliveryPlanLine[] = [];
  for (const row of rows) {
    if (row.unitKind === 'NOT_REQUIRED' || row.units === null) {
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
  const errors: DeliveryCompensationErrorCode[] = [];
  const designError = validateDesignModeAssignment(input);
  if (designError) {
    errors.push(designError);
  }

  const rates = rateByRole(input.rates);
  errors.push(...collectConfigErrors(input.baseRoleUnits, rates));
  for (const feature of input.features) {
    if (feature.origin === 'INCLUDED') {
      continue;
    }
    errors.push(...collectConfigErrors(feature.roleUnits, rates));
  }

  const uniqueErrors = [...new Set(errors)];
  const lines: DeliveryPlanLine[] = [];
  if (uniqueErrors.length === 0) {
    lines.push(...linesForVector('BASE', input.baseRoleUnits, rates));
    for (const feature of input.features) {
      if (feature.origin === 'INCLUDED') {
        continue;
      }
      lines.push(...linesForVector(`FEATURE:${feature.functionId}`, feature.roleUnits, rates));
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

  const totalsByRole = emptyTotals();
  for (const role of DELIVERY_COMPENSATION_ROLE_KEYS) {
    totalsByRole[role] = sumMoney(
      lines.filter((line) => line.roleKey === role).map((line) => line.amount),
    );
  }

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
