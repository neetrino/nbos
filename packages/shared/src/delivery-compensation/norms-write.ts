import { PRODUCT_CATEGORIES, PRODUCT_TYPES } from '../constants';
import {
  CatalogContentValidationError,
  CatalogFinancialMassAssignmentError,
} from './catalog-write';
import {
  DELIVERY_COMPENSATION_ROLE_KEYS,
  DELIVERY_ENTITY_KINDS,
  DELIVERY_ROLE_UNIT_KINDS,
  frozenDeliveryAxes,
  type DeliveryDesignMode,
  type DeliveryEntityKind,
  type DeliveryImplementationBase,
} from './constants';
import { DeliveryDecimalError, parseUnits } from './decimal-scale';
import type { DeliveryRoleUnitInput } from './role-units';

/** Units and rates never come from payroll, grades or individual employees. */
const FORBIDDEN_NORM_KEYS = ['employeeId', 'employee_id', 'salary', 'baseSalary', 'grade'] as const;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROFILE_KEY_MAX_LENGTH = 120;

export type FunctionPriceWriteInput = {
  functionId: string;
  /** Null prices a card with a single volume. Required when the card has gradations. */
  tierId: string | null;
  effectiveFrom: string;
  roleUnits: DeliveryRoleUnitInput[];
};

export type ProductTypeKey = (typeof PRODUCT_TYPES)[number];
export type ProductCategoryKey = (typeof PRODUCT_CATEGORIES)[number];

export type BaseProfileWriteInput = {
  profileKey: string;
  entityKind: DeliveryEntityKind;
  productType: ProductTypeKey | null;
  productCategory: ProductCategoryKey | null;
  implementationBase: DeliveryImplementationBase;
  designMode: DeliveryDesignMode;
  aiDesignerReview: boolean;
  description: string | null;
  effectiveFrom: string;
  roleUnits: DeliveryRoleUnitInput[];
  includedFunctionIds: string[];
};

export function parseFunctionPriceWriteBody(body: unknown): FunctionPriceWriteInput {
  const record = readNormRecord(body);
  return {
    functionId: readUuid(record.functionId, 'functionId'),
    tierId: readOptionalUuid(record.tierId, 'tierId'),
    effectiveFrom: readEffectiveFrom(record.effectiveFrom),
    roleUnits: parseRoleUnitVector(record.roleUnits),
  };
}

/** Card-level drafts never replace published gradation vectors. */
export function functionPriceTierTargetError(
  existingTierIds: readonly string[],
  requestedTierId: string | null,
): string | null {
  if (existingTierIds.length === 0) {
    return requestedTierId === null ? null : 'tierId is not used for a function without gradations';
  }
  if (requestedTierId === null) {
    return 'tierId is required for a function with gradations';
  }
  if (!existingTierIds.includes(requestedTierId)) {
    return 'tierId does not belong to this function';
  }
  return null;
}

export function parseBaseProfileWriteBody(body: unknown): BaseProfileWriteInput {
  const record = readNormRecord(body);
  const entityKind = readEnum(record.entityKind, DELIVERY_ENTITY_KINDS, 'entityKind');
  const productType = readOptionalEnum(record.productType, PRODUCT_TYPES, 'productType');
  if (entityKind === 'PRODUCT' && productType === null) {
    throw new CatalogContentValidationError('productType is required for PRODUCT profiles');
  }
  return {
    profileKey: readProfileKey(record.profileKey),
    entityKind,
    productType,
    productCategory: readOptionalEnum(
      record.productCategory,
      PRODUCT_CATEGORIES,
      'productCategory',
    ),
    ...frozenDeliveryAxes(),
    description: readOptionalText(record.description),
    effectiveFrom: readEffectiveFrom(record.effectiveFrom),
    roleUnits: parseRoleUnitVector(record.roleUnits),
    includedFunctionIds: readFunctionIdList(record.includedFunctionIds),
  };
}

function readNormRecord(body: unknown): Record<string, unknown> {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new CatalogContentValidationError('body must be an object');
  }
  const record = body as Record<string, unknown>;
  const leaked = FORBIDDEN_NORM_KEYS.filter((key) => key in record);
  if (leaked.length > 0) {
    throw new CatalogFinancialMassAssignmentError(leaked);
  }
  return record;
}

/**
 * The vector always carries all six roles. `units: null` means not configured and
 * is never treated as zero; an explicit zero stays an Owner decision at publish time.
 */
function parseRoleUnitVector(value: unknown): DeliveryRoleUnitInput[] {
  if (!Array.isArray(value)) {
    throw new CatalogContentValidationError('roleUnits is required');
  }
  const rows = value.map((entry) => parseRoleUnitRow(entry));
  const seen = new Set(rows.map((row) => row.roleKey));
  if (seen.size !== rows.length) {
    throw new CatalogContentValidationError('roleUnits contains duplicate roleKey');
  }
  const missing = DELIVERY_COMPENSATION_ROLE_KEYS.filter((role) => !seen.has(role));
  if (missing.length > 0) {
    throw new CatalogContentValidationError(`roleUnits is missing roles: ${missing.join(', ')}`);
  }
  return rows;
}

function parseRoleUnitRow(entry: unknown): DeliveryRoleUnitInput {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new CatalogContentValidationError('roleUnits entries must be objects');
  }
  const row = entry as Record<string, unknown>;
  const roleKey = readEnum(row.roleKey, DELIVERY_COMPENSATION_ROLE_KEYS, 'roleKey');
  const unitKind = readEnum(row.unitKind, DELIVERY_ROLE_UNIT_KINDS, 'unitKind');
  const units = readNullableUnits(row.units, roleKey);
  if (unitKind === 'NOT_REQUIRED' && units !== null) {
    throw new CatalogContentValidationError(`${roleKey} is NOT_REQUIRED and cannot carry units`);
  }
  return { roleKey, unitKind, units };
}

export function parseFunctionPricePatchBody(body: unknown): {
  roleUnits: DeliveryRoleUnitInput[];
} {
  const record = readNormRecord(body);
  return { roleUnits: parseRoleUnitVector(record.roleUnits) };
}

function readNullableUnits(value: unknown, roleKey: string): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw new CatalogContentValidationError(`${roleKey} units must be a decimal string`);
  }
  const text = value.trim();
  try {
    if (parseUnits(text).value < 0n) {
      throw new CatalogContentValidationError(`${roleKey} units must be greater or equal to 0`);
    }
  } catch (error) {
    if (error instanceof DeliveryDecimalError) {
      throw new CatalogContentValidationError(`${roleKey} units is invalid`);
    }
    throw error;
  }
  return text;
}

function readEnum<T extends string>(value: unknown, allowed: readonly T[], key: string): T {
  const match = allowed.find((option) => option === value);
  if (!match) {
    throw new CatalogContentValidationError(`${key} is invalid`);
  }
  return match;
}

function readOptionalEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  key: string,
): T | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return readEnum(value, allowed, key);
}

function readUuid(value: unknown, key: string): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value.trim())) {
    throw new CatalogContentValidationError(`${key} must be a uuid`);
  }
  return value.trim();
}

function readOptionalUuid(value: unknown, key: string): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return readUuid(value, key);
}

function readEffectiveFrom(value: unknown): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new CatalogContentValidationError('effectiveFrom is required');
  }
  return value;
}

function readProfileKey(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new CatalogContentValidationError('profileKey is required');
  }
  const text = value.trim();
  if (text.length > PROFILE_KEY_MAX_LENGTH) {
    throw new CatalogContentValidationError('profileKey is too long');
  }
  return text;
}

function readOptionalText(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}

function readFunctionIdList(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new CatalogContentValidationError('includedFunctionIds must be an array');
  }
  const ids = value.map((entry) => readUuid(entry, 'includedFunctionIds'));
  return [...new Set(ids)];
}
