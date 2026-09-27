import { Decimal } from '@nbos/database';

export const SALES_KPI_MONEY_DECIMAL_PLACES = 2;
export const SALES_KPI_ATTAINMENT_DECIMAL_PLACES = 2;

export function roundSalesKpiMoney(value: Decimal): Decimal {
  return value.toDecimalPlaces(SALES_KPI_MONEY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
}

export function roundSalesKpiAttainmentPct(value: Decimal): Decimal {
  return value.toDecimalPlaces(SALES_KPI_ATTAINMENT_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
}

/**
 * One stored result per employee and calendar month. Zero or several rows cannot be
 * chosen by array/database order — callers must hold that Sales bonus.
 */
export function pickUniqueEmployeePeriodKpiResult<T>(rows: readonly T[]): T | null {
  if (rows.length !== 1) {
    return null;
  }
  return rows[0] ?? null;
}
