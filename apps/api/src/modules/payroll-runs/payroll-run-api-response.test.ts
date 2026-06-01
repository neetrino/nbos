import { describe, expect, it } from 'vitest';
import { omitLegacyPayrollKpiFields } from './payroll-run-api-response';

describe('omitLegacyPayrollKpiFields', () => {
  it('removes legacy KPI columns from payroll API payloads', () => {
    const row = {
      id: 'run1',
      kpiSalesPlanAmount: '1000',
      kpiSalesActualAmount: '500',
      status: 'DRAFT',
    };
    const stripped = omitLegacyPayrollKpiFields(row);
    expect(stripped).toEqual({ id: 'run1', status: 'DRAFT' });
  });
});
