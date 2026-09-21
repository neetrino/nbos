import {
  DELIVERY_COMPENSATION_ROLE_KEYS,
  type DeliveryCompensationRoleKey,
  type DeliveryRoleUnitKind,
} from './constants';

export type DeliveryRoleUnitInput = {
  roleKey: DeliveryCompensationRoleKey;
  unitKind: DeliveryRoleUnitKind;
  /** Null means not configured. Zero is an explicit Owner decision. */
  units: string | null;
};

export function isRoleUnitsConfigured(input: DeliveryRoleUnitInput): boolean {
  if (input.unitKind === 'NOT_REQUIRED') {
    return input.units === null;
  }
  return input.units !== null;
}

export function isExplicitZeroUnits(units: string | null): boolean {
  if (units === null) {
    return false;
  }
  return Number(units) === 0;
}

export function assertCompleteRoleMatrix(
  rows: readonly DeliveryRoleUnitInput[],
): DeliveryCompensationRoleKey[] {
  const present = new Set(rows.map((row) => row.roleKey));
  return DELIVERY_COMPENSATION_ROLE_KEYS.filter((role) => !present.has(role));
}

export function findUnconfiguredRequiredRoles(
  rows: readonly DeliveryRoleUnitInput[],
): DeliveryCompensationRoleKey[] {
  return rows
    .filter((row) => row.unitKind === 'REQUIRED' && row.units === null)
    .map((row) => row.roleKey);
}

export function hasExplicitZeroRequiredUnits(rows: readonly DeliveryRoleUnitInput[]): boolean {
  return rows.some((row) => row.unitKind === 'REQUIRED' && isExplicitZeroUnits(row.units));
}

export function isPublishedRoleVectorComplete(rows: readonly DeliveryRoleUnitInput[]): boolean {
  if (assertCompleteRoleMatrix(rows).length > 0) {
    return false;
  }
  if (findUnconfiguredRequiredRoles(rows).length > 0) {
    return false;
  }
  return rows.every((row) => {
    if (row.unitKind === 'NOT_REQUIRED') {
      return row.units === null;
    }
    return row.units !== null && Number.isFinite(Number(row.units)) && Number(row.units) >= 0;
  });
}
