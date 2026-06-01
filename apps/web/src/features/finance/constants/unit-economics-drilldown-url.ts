import type { UnitEconomicsDrilldownFocus } from '@/lib/api/unit-economics';

/** Open delivery unit drill-down when landing on `/finance/unit-economics`. */
export const UNIT_ECONOMICS_OPEN_ORDER_QUERY = 'unit' as const;

/** Active drill-down tab: invoices | payments | expenses | bonuses. */
export const UNIT_ECONOMICS_DRILLDOWN_FOCUS_QUERY = 'focus' as const;

const VALID_FOCUS: UnitEconomicsDrilldownFocus[] = ['invoices', 'payments', 'expenses', 'bonuses'];

export function parseUnitEconomicsDrilldownFocus(
  raw: string | null | undefined,
): UnitEconomicsDrilldownFocus {
  if (raw && VALID_FOCUS.includes(raw as UnitEconomicsDrilldownFocus)) {
    return raw as UnitEconomicsDrilldownFocus;
  }
  return 'invoices';
}

export function unitEconomicsDrilldownHref(
  orderId: string,
  focus: UnitEconomicsDrilldownFocus = 'invoices',
): string {
  const q = new URLSearchParams({
    [UNIT_ECONOMICS_OPEN_ORDER_QUERY]: orderId,
    [UNIT_ECONOMICS_DRILLDOWN_FOCUS_QUERY]: focus,
  });
  return `/finance/unit-economics?${q.toString()}`;
}
