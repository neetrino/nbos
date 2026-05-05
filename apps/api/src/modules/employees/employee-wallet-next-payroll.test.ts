import { describe, expect, it } from 'vitest';

import { pickNextOpenPayrollSalaryLine } from './employee-wallet-next-payroll';

describe('pickNextOpenPayrollSalaryLine', () => {
  it('returns undefined when no open runs', () => {
    expect(
      pickNextOpenPayrollSalaryLine([
        { payrollRun: { payrollMonth: '2026-03', status: 'CLOSED' } },
      ] as const),
    ).toBeUndefined();
  });

  it('prefers earliest payroll month among open runs', () => {
    const a = { id: 'a', payrollRun: { payrollMonth: '2026-05', status: 'DRAFT' as const } };
    const b = { id: 'b', payrollRun: { payrollMonth: '2026-04', status: 'REVIEW' as const } };
    const c = { id: 'c', payrollRun: { payrollMonth: '2026-06', status: 'APPROVED' as const } };
    expect(pickNextOpenPayrollSalaryLine([a, b, c])).toEqual(b);
  });
});
