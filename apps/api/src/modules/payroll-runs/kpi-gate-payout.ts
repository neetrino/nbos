import { Decimal } from '@nbos/database';

import type { KpiGateRules } from './kpi-gate-rules.types';

const ZERO = new Decimal(0);
const ONE = new Decimal(1);

/**
 * Payout multiplier from plan attainment and policy bands (NBOS KPI gate template).
 */
export function computeKpiGatePayoutFactor(
  plan: Decimal,
  actual: Decimal,
  rules: KpiGateRules,
): Decimal {
  if (plan.lte(0)) {
    return ONE;
  }
  const attainmentPct = actual.div(plan).mul(100);
  for (const band of rules.bands) {
    if (attainmentPct.gte(band.minAttainmentPct)) {
      return new Decimal(band.payoutFactor);
    }
  }
  return ZERO;
}
