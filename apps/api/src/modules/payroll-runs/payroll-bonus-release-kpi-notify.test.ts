import { describe, expect, it } from 'vitest';
import { formatBonusKpiReducedNotifyBody } from './payroll-bonus-release-kpi-notify';

describe('formatBonusKpiReducedNotifyBody', () => {
  it('mentions release vs included and payroll month', () => {
    const body = formatBonusKpiReducedNotifyBody({
      orderCode: 'ORD-9',
      releaseAmount: '1000.00',
      includedAmount: '500.00',
      payrollMonth: '2026-04',
    });
    expect(body).toContain('ORD-9');
    expect(body).toContain('1000.00');
    expect(body).toContain('500.00');
    expect(body).toContain('2026-04');
    expect(body).toContain('sales KPI');
  });
});
