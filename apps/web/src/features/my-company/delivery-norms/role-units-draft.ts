import {
  DELIVERY_COMPENSATION_ROLE_KEYS,
  parseUnits,
  type DeliveryCompensationRoleKey,
  type DeliveryRoleUnitInput,
  type DeliveryRoleUnitKind,
} from '@nbos/shared';
import { SEED_ROLE_RATE_AMD } from './delivery-norms.constants';

export type RoleUnitDraftRow = {
  roleKey: DeliveryCompensationRoleKey;
  unitKind: DeliveryRoleUnitKind;
  unitsInput: string;
};

export type RoleRateDraftMap = Record<DeliveryCompensationRoleKey, string>;

export function emptyUnitsInputToNull(input: string): string | null {
  const trimmed = input.trim();
  return trimmed === '' ? null : trimmed;
}

export function createEmptyRoleUnitDrafts(): RoleUnitDraftRow[] {
  return DELIVERY_COMPENSATION_ROLE_KEYS.map((roleKey) => ({
    roleKey,
    unitKind: 'REQUIRED',
    unitsInput: '',
  }));
}

export function createEmptyRoleRateDrafts(): RoleRateDraftMap {
  return Object.fromEntries(
    DELIVERY_COMPENSATION_ROLE_KEYS.map((roleKey) => [roleKey, '']),
  ) as RoleRateDraftMap;
}

export function fillRoleRatesAtSeed(current: RoleRateDraftMap): RoleRateDraftMap {
  const next = { ...current };
  for (const roleKey of DELIVERY_COMPENSATION_ROLE_KEYS) {
    next[roleKey] = SEED_ROLE_RATE_AMD;
  }
  return next;
}

export function replaceRoleUnitDraft(
  rows: readonly RoleUnitDraftRow[],
  roleKey: DeliveryCompensationRoleKey,
  patch: Partial<Omit<RoleUnitDraftRow, 'roleKey'>>,
): RoleUnitDraftRow[] {
  return rows.map((row) => {
    if (row.roleKey !== roleKey) {
      return row;
    }
    const next = { ...row, ...patch };
    if (next.unitKind === 'NOT_REQUIRED') {
      next.unitsInput = '';
    }
    return next;
  });
}

export function parseUnitsDraft(input: string): string | null | undefined {
  const units = emptyUnitsInputToNull(input);
  if (units === null) {
    return null;
  }
  try {
    if (parseUnits(units).value < 0n) {
      return undefined;
    }
    return units;
  } catch {
    return undefined;
  }
}

export function buildCompleteRoleUnitVector(
  drafts: readonly RoleUnitDraftRow[],
): DeliveryRoleUnitInput[] | null {
  const byRole = new Map(drafts.map((row) => [row.roleKey, row]));
  const vector: DeliveryRoleUnitInput[] = [];
  for (const roleKey of DELIVERY_COMPENSATION_ROLE_KEYS) {
    const row = byRole.get(roleKey);
    if (!row) {
      return null;
    }
    const units = row.unitKind === 'NOT_REQUIRED' ? null : parseUnitsDraft(row.unitsInput);
    if (units === undefined) {
      return null;
    }
    vector.push({ roleKey, unitKind: row.unitKind, units });
  }
  return vector;
}
