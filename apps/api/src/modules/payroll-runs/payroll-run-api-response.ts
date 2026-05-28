/** Strips legacy editable payroll KPI columns from public API payloads. */
export function omitLegacyPayrollKpiFields<T extends Record<string, unknown>>(
  row: T,
): Omit<T, 'kpiSalesPlanAmount' | 'kpiSalesActualAmount'> {
  const copy = { ...row };
  delete copy.kpiSalesPlanAmount;
  delete copy.kpiSalesActualAmount;
  return copy as Omit<T, 'kpiSalesPlanAmount' | 'kpiSalesActualAmount'>;
}
