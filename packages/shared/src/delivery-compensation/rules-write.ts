import { DELIVERY_COMPENSATION_CURRENCY, DELIVERY_COMPENSATION_ROLE_KEYS } from './constants';
import {
  CatalogContentValidationError,
  CatalogFinancialMassAssignmentError,
} from './catalog-write';
import { DeliveryDecimalError, parseRate } from './decimal-scale';

const FORBIDDEN_RATE_KEYS = ['employeeId', 'employee_id', 'salary', 'baseSalary', 'grade'] as const;

export type RoleRateWriteInput = {
  roleKey: (typeof DELIVERY_COMPENSATION_ROLE_KEYS)[number];
  rate: string;
  effectiveFrom: string;
  currency: string;
};

export function parseRoleRateWriteBody(body: unknown): RoleRateWriteInput {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new CatalogContentValidationError('body must be an object');
  }
  const record = body as Record<string, unknown>;
  const leaked = FORBIDDEN_RATE_KEYS.filter((key) => key in record);
  if (leaked.length > 0) {
    throw new CatalogFinancialMassAssignmentError(leaked);
  }
  const roleKey = DELIVERY_COMPENSATION_ROLE_KEYS.find((role) => role === record.roleKey);
  if (!roleKey) {
    throw new CatalogContentValidationError('roleKey is invalid');
  }
  if (typeof record.rate !== 'string' || record.rate.trim() === '') {
    throw new CatalogContentValidationError('rate is required');
  }
  assertAmdCurrency(record.currency);
  const rate = parseNonNegativeRate(record.rate.trim());
  if (typeof record.effectiveFrom !== 'string' || Number.isNaN(Date.parse(record.effectiveFrom))) {
    throw new CatalogContentValidationError('effectiveFrom is required');
  }
  return {
    roleKey,
    rate,
    effectiveFrom: record.effectiveFrom,
    currency: DELIVERY_COMPENSATION_CURRENCY,
  };
}

export function parseRoleRatePatchBody(body: unknown): { rate: string } {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new CatalogContentValidationError('body must be an object');
  }
  const record = body as Record<string, unknown>;
  const leaked = FORBIDDEN_RATE_KEYS.filter((key) => key in record);
  if (leaked.length > 0) {
    throw new CatalogFinancialMassAssignmentError(leaked);
  }
  if (typeof record.rate !== 'string' || record.rate.trim() === '') {
    throw new CatalogContentValidationError('rate is required');
  }
  return { rate: parseNonNegativeRate(record.rate.trim()) };
}

function assertAmdCurrency(currency: unknown): void {
  if (currency === undefined || currency === null || currency === '') {
    return;
  }
  if (typeof currency !== 'string' || currency.trim() !== DELIVERY_COMPENSATION_CURRENCY) {
    throw new CatalogContentValidationError('currency must be AMD');
  }
}

function parseNonNegativeRate(rate: string): string {
  try {
    const parsed = parseRate(rate);
    if (parsed.value < 0n) {
      throw new CatalogContentValidationError('rate must be greater than or equal to 0');
    }
    return rate;
  } catch (error) {
    if (error instanceof CatalogContentValidationError) {
      throw error;
    }
    if (error instanceof DeliveryDecimalError) {
      throw new CatalogContentValidationError('rate is invalid');
    }
    throw error;
  }
}
