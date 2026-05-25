import { Decimal } from '@nbos/database';

const ZERO = new Decimal(0);

/**
 * Advisory KPI-held amount (not persisted burned ledger) when gate is explicitly false.
 * Shows planned bonus not yet released while KPI gate is open.
 */
export function computeAdvisoryKpiHeldAmount(
  planned: Decimal,
  released: Decimal,
  kpiGatePassed: boolean | null,
): Decimal | null {
  if (kpiGatePassed !== false) {
    return null;
  }
  const held = Decimal.max(ZERO, planned.minus(released));
  return held.gt(0) ? held : null;
}
