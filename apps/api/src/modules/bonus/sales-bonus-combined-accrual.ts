import { Decimal } from '@nbos/database';

/** Combined Seller + Assistant Sales accrual ceiling per order, before KPI (BR-30). */
export const SALES_ORDER_COMBINED_ACCRUAL_CAP_AMD = new Decimal('300000');

const PERCENT_DIVISOR = new Decimal(100);
const MONEY_DECIMAL_PLACES = 2;
const ZERO = new Decimal(0);

export type CappedSalesRoleAmounts = {
  sellerAmount: Decimal;
  assistantAmount: Decimal;
};

/** Uncapped role amount. Intermediate rate math stays precise until allocation. */
export function uncappedSalesRoleAmount(baseAmount: Decimal, percent: Decimal): Decimal {
  return baseAmount.mul(percent).div(PERCENT_DIVISOR);
}

/**
 * Uncapped combined Seller + Assistant accrual. Both role rates are always included,
 * including when one employee holds both roles.
 */
export function combinedSalesAccrualAmount(
  baseAmount: Decimal,
  sellerPercent: Decimal,
  assistantPercent: Decimal,
): Decimal {
  return uncappedSalesRoleAmount(baseAmount, sellerPercent)
    .plus(uncappedSalesRoleAmount(baseAmount, assistantPercent))
    .toDecimalPlaces(MONEY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
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

/** Remaining lifetime envelope after amounts already stored on the order. */
export function remainingSalesOrderAccrualCap(alreadyAccrued: Decimal): Decimal {
  return Decimal.max(
    ZERO,
    SALES_ORDER_COMBINED_ACCRUAL_CAP_AMD.minus(alreadyAccrued),
  ).toDecimalPlaces(MONEY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
}

/**
 * Split a wave by actual rate proportions. Under the cap, each role keeps its own
 * amount. Over the cap, Seller is rounded first and Assistant receives the residue
 * so the components equal the capped total (Q-39).
 */
export function allocateCappedSalesRoleAmounts(input: {
  sellerUncapped: Decimal;
  assistantUncapped: Decimal;
  cap?: Decimal;
}): CappedSalesRoleAmounts {
  const cap = input.cap ?? SALES_ORDER_COMBINED_ACCRUAL_CAP_AMD;
  const combined = input.sellerUncapped.plus(input.assistantUncapped);
  if (cap.lte(0) || combined.lte(0)) {
    return { sellerAmount: ZERO, assistantAmount: ZERO };
  }
  if (combined.gt(cap)) {
    const sellerAmount = roundBonusMoney(input.sellerUncapped.div(combined).mul(cap));
    return {
      sellerAmount,
      assistantAmount: Decimal.max(ZERO, cap.minus(sellerAmount)),
    };
  }
  return allocateUnderRemainder(input.sellerUncapped, input.assistantUncapped, cap);
}

/** Seller rounds first; Assistant keeps the residue when rounding would exceed the remainder. */
function allocateUnderRemainder(
  sellerUncapped: Decimal,
  assistantUncapped: Decimal,
  remainder: Decimal,
): CappedSalesRoleAmounts {
  const sellerAmount = roundBonusMoney(sellerUncapped);
  const assistantRounded = roundBonusMoney(assistantUncapped);
  if (sellerAmount.plus(assistantRounded).lte(remainder)) {
    return { sellerAmount, assistantAmount: assistantRounded };
  }
  return {
    sellerAmount,
    assistantAmount: Decimal.max(ZERO, remainder.minus(sellerAmount)),
  };
}

function roundBonusMoney(value: Decimal): Decimal {
  return value.toDecimalPlaces(MONEY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
}
