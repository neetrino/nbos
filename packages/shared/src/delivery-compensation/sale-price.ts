import { CatalogContentValidationError } from './catalog-write';
import { DELIVERY_MONEY_SCALE, DELIVERY_UNITS_SCALE } from './constants';
import {
  addScaled,
  parseRate,
  parseScaledDecimal,
  parseUnits,
  quantizeScaled,
  scaledToString,
  sumMoney,
} from './decimal-scale';

export type SalePriceTarget =
  | { kind: 'FUNCTION'; functionId: string }
  | { kind: 'TIER'; tierId: string }
  | { kind: 'CORE'; baseProfileVersionId: string };

export type SalePriceWriteInput = {
  target: SalePriceTarget;
  effectiveFrom: string;
  amountPerUnit: string;
};

export type SalePriceSource = 'CARD' | 'UNKNOWN';

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
 * Client line amount for a function, a gradation, or a core. The stored figure is the whole
 * price of that card. Units do not scale it. No stored amount means no price.
 */
export function resolveSalePrice(input: { amount: string | null }): {
  amount: string | null;
  source: SalePriceSource;
} {
  if (input.amount === null) return { amount: null, source: 'UNKNOWN' };
  return {
    amount: scaledToString(quantizeScaled(parseRate(input.amount), DELIVERY_MONEY_SCALE)),
    source: 'CARD',
  };
}

/** Total units of a priced item. Unconfigured roles do not count as zero. */
export function sumConfiguredRoleUnits(
  rows: ReadonlyArray<{ units: string | null }>,
): string | null {
  const values = rows.map((row) => row.units).filter((units): units is string => units !== null);
  if (values.length === 0) return null;
  return scaledToString(
    values.reduce((total, units) => addScaled(total, parseUnits(units)), parseUnits('0')),
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
  return {
    target,
    effectiveFrom: requireDate(row.effectiveFrom),
    amountPerUnit: requirePositiveAmount(row.amountPerUnit, 'amountPerUnit'),
  };
}

export function parseSalePricePatchBody(body: unknown): { amountPerUnit: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new CatalogContentValidationError('Body must be an object.');
  }
  const row = body as Record<string, unknown>;
  return { amountPerUnit: requirePositiveAmount(row.amountPerUnit, 'amountPerUnit') };
}

function requirePositiveAmount(value: unknown, field: string): string {
  if (value === undefined || value === null || value === '') {
    throw new CatalogContentValidationError(`${field} is required.`);
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new CatalogContentValidationError(`${field} must be a number.`);
  }
  try {
    const parsed = parseScaledDecimal(String(value), DELIVERY_UNITS_SCALE);
    if (parsed.value <= 0n) {
      throw new CatalogContentValidationError(`${field} must be greater than zero.`);
    }
    return scaledToString(parsed);
  } catch (error) {
    if (error instanceof CatalogContentValidationError) throw error;
    throw new CatalogContentValidationError(`${field} must be a number.`);
  }
}

function requireDate(value: unknown): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new CatalogContentValidationError('effectiveFrom must be a date.');
  }
  return value;
}
