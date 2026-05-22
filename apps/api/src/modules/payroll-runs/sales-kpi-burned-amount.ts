import { Decimal, type BonusTypeEnum } from '@nbos/database';

/**
 * Burned bonus at payroll attach when SALES KPI scales payout below release amount.
 * Persisted on `BonusRelease.kpiBurnedAmount` (policy engine MVP).
 */
export function computeSalesKpiBurnedAmount(params: {
  releaseAmount: Decimal;
  includedAmount: Decimal;
  bonusType: BonusTypeEnum | string;
}): Decimal | null {
  if (params.bonusType !== 'SALES') {
    return null;
  }
  const burned = params.releaseAmount.minus(params.includedAmount);
  if (burned.lte(0)) {
    return null;
  }
  return burned.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}
