import { Decimal } from '@nbos/database';

/** Combined Seller + Assistant Sales accrual ceiling per order, before KPI (BR-30). */
export const SALES_ORDER_COMBINED_ACCRUAL_CAP_AMD = new Decimal('300000');

const PERCENT_DIVISOR = new Decimal(100);

/**
 * Uncapped combined Seller + Assistant accrual. Both role rates are always included,
 * including when one employee holds both roles.
 */
export function combinedSalesAccrualAmount(
  baseAmount: Decimal,
  sellerPercent: Decimal,
  assistantPercent: Decimal,
): Decimal {
  const sellerAmount = baseAmount.mul(sellerPercent).div(PERCENT_DIVISOR);
  const assistantAmount = baseAmount.mul(assistantPercent).div(PERCENT_DIVISOR);
  return sellerAmount.plus(assistantAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/** Cap the combined accrual at 300,000 AMD. Does not allocate an 8:2 split. */
export function cappedCombinedSalesAccrual(uncapped: Decimal): Decimal {
  return Decimal.min(uncapped, SALES_ORDER_COMBINED_ACCRUAL_CAP_AMD);
}

/**
 * First qualifying product invoice floor: combined capped Sales accrual, with no KPI factor.
 */
export function firstProductInvoiceMinimumAmount(
  baseAmount: Decimal,
  sellerPercent: Decimal,
  assistantPercent: Decimal,
): Decimal {
  return cappedCombinedSalesAccrual(
    combinedSalesAccrualAmount(baseAmount, sellerPercent, assistantPercent),
  );
}
