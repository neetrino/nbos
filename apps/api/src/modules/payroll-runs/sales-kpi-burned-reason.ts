import { Decimal } from '@nbos/database';

const MAX_REASON_LEN = 240;

function moneyLabel(value: Decimal): string {
  return value.toFixed(2);
}

function attainmentPctLabel(plan: Decimal, actual: Decimal): string {
  const pct = actual.div(plan).mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  return `${pct.toString()}%`;
}

/**
 * Human-readable audit line when SALES KPI scales payout below release amount at attach.
 */
export function formatSalesKpiBurnedReason(params: {
  bonusType: string;
  plan: Decimal | null;
  actual: Decimal | null;
  payoutFactor: Decimal;
  burnedAmount: Decimal | null;
}): string | null {
  if (params.bonusType !== 'SALES') {
    return null;
  }
  const burned = params.burnedAmount;
  if (burned == null || burned.lte(0)) {
    return null;
  }

  const plan = params.plan;
  const actual = params.actual;
  const payoutPct = params.payoutFactor.mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);

  let core: string;
  if (plan != null && actual != null && plan.gt(0)) {
    core =
      `Sales KPI: ${attainmentPctLabel(plan, actual)} of plan (${moneyLabel(actual)}/${moneyLabel(plan)})` +
      ` → ${payoutPct.toString()}% payout`;
  } else {
    core = `Sales KPI: ${payoutPct.toString()}% payout scale applied`;
  }

  const line = `${core}; ${moneyLabel(burned)} excluded from payroll`;
  return line.length <= MAX_REASON_LEN ? line : `${line.slice(0, MAX_REASON_LEN - 1)}…`;
}
