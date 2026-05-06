import { Decimal } from '@nbos/database';

export const BONUS_POOL_ZERO = new Decimal(0);

export function decimalFrom(value: Decimal | number | string | null | undefined): Decimal {
  if (value == null) return BONUS_POOL_ZERO;
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}
