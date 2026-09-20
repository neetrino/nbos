import { CatalogContentValidationError } from './catalog-write';
import {
  multiplyScaled,
  parseScaledDecimal,
  quantizeScaled,
  scaledToString,
  sumMoney,
  unitsTimesRate,
} from './decimal-scale';
import { DELIVERY_MONEY_SCALE } from './constants';

export const SALE_MULTIPLIER_SCALE = 4;
export const DEFAULT_SALE_MULTIPLIER = '10';

export type SalePriceTarget =
  | { kind: 'FUNCTION'; functionId: string }
  | { kind: 'TIER'; tierId: string }
  | { kind: 'CORE'; baseProfileVersionId: string };

export type SalePriceWriteInput = {
  target: SalePriceTarget;
  effectiveFrom: string;
  multiplier: string | null;
  fixedAmount: string | null;
};

/**
 * Identifies what a sale price version prices. A plain identifier would not be enough: the same
 * version number must be unique per priced thing, and a function, one of its gradations and a product
 * core are three different things.
 */
export function salePriceTargetKey(target: SalePriceTarget): string {
  if (target.kind === 'FUNCTION') return `FUNCTION:${target.functionId}`;
  if (target.kind === 'TIER') return `TIER:${target.tierId}`;
  return `CORE:${target.baseProfileVersionId}`;
}

/**
 * Sale price of one item. A fixed amount wins over a multiplier, because a round market price is a
 * decision and a multiplier is only a rule of thumb. With neither, the global default multiplier
 * applies, so a card never ends up without a price while the Owner fills the catalog.
 */
export function resolveSalePrice(input: {
  units: string | null;
  developerRate: string | null;
  multiplier: string | null;
  fixedAmount: string | null;
  defaultMultiplier: string;
}): { amount: string | null; source: 'FIXED' | 'MULTIPLIER' | 'DEFAULT_MULTIPLIER' | 'UNKNOWN' } {
  if (input.fixedAmount !== null) {
    return { amount: toMoney(input.fixedAmount), source: 'FIXED' };
  }
  if (input.units === null || input.developerRate === null) {
    return { amount: null, source: 'UNKNOWN' };
  }
  const cost = unitsTimesRate(input.units, input.developerRate);
  if (input.multiplier !== null) {
    return { amount: applyMultiplier(cost, input.multiplier), source: 'MULTIPLIER' };
  }
  return {
    amount: applyMultiplier(cost, input.defaultMultiplier),
    source: 'DEFAULT_MULTIPLIER',
  };
}

function applyMultiplier(cost: string, multiplier: string): string {
  const product = multiplyScaled(
    parseScaledDecimal(cost, DELIVERY_MONEY_SCALE),
    parseScaledDecimal(multiplier, SALE_MULTIPLIER_SCALE),
  );
  return scaledToString(quantizeScaled(product, DELIVERY_MONEY_SCALE));
}

function toMoney(raw: string): string {
  return scaledToString(
    quantizeScaled(parseScaledDecimal(raw, DELIVERY_MONEY_SCALE), DELIVERY_MONEY_SCALE),
  );
}

/** Sum of item prices. An item without a resolvable price makes the total unknown, not smaller. */
export function sumSalePrices(amounts: ReadonlyArray<string | null>): string | null {
  if (amounts.some((amount) => amount === null)) {
    return null;
  }
  return sumMoney(amounts.filter((amount): amount is string => amount !== null));
}

export function parseSalePriceBody(body: unknown, target: SalePriceTarget): SalePriceWriteInput {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new CatalogContentValidationError('Body must be an object.');
  }
  const row = body as Record<string, unknown>;
  const multiplier = optionalPositiveNumber(row.multiplier, 'multiplier', SALE_MULTIPLIER_SCALE);
  const fixedAmount = optionalPositiveNumber(row.fixedAmount, 'fixedAmount', DELIVERY_MONEY_SCALE);
  if (multiplier === null && fixedAmount === null) {
    throw new CatalogContentValidationError('Set a sale multiplier or a fixed sale amount.');
  }
  return {
    target,
    effectiveFrom: requireDate(row.effectiveFrom),
    multiplier,
    fixedAmount,
  };
}

function optionalPositiveNumber(value: unknown, field: string, scale: number): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new CatalogContentValidationError(`${field} must be a number.`);
  }
  const parsed = safeParse(String(value), scale);
  if (parsed === null) {
    throw new CatalogContentValidationError(`${field} must be a number.`);
  }
  if (parsed.value <= 0n) {
    throw new CatalogContentValidationError(`${field} must be greater than zero.`);
  }
  return scaledToString(parsed);
}

function safeParse(raw: string, scale: number) {
  try {
    return parseScaledDecimal(raw, scale);
  } catch {
    return null;
  }
}

function requireDate(value: unknown): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new CatalogContentValidationError('effectiveFrom must be a date.');
  }
  return value;
}
