import { describe, expect, it } from 'vitest';
import {
  buildPayrollRunsScopeStatsCsvContent,
  type PayrollRunsScopeStatsCsvFilterMeta,
} from '@/features/finance/utils/export-payroll-runs-scope-stats-csv';
import type { PayrollRunStats } from '@/lib/api/payroll-runs';

const META: PayrollRunsScopeStatsCsvFilterMeta = {
  statusScope: 'APPROVED',
  payrollMonthFrom: '2026-01',
  payrollMonthTo: '2026-03',
  exportedAtIso: '2026-04-29T12:00:00.000Z',
};

const SAMPLE_STATS: PayrollRunStats = {
  runCount: 2,
  totals: {
    totalBaseSalary: '10000.00',
    totalBonuses: '500.00',
    totalPayable: '10300.00',
    totalPaid: '3000.00',
    totalRemaining: '7300.00',
  },
  byStatus: [
    {
      status: 'APPROVED',
      runCount: 1,
      totalPayable: '5000.00',
      totalPaid: '0.00',
      totalRemaining: '5000.00',
    },
    {
      status: 'CLOSED',
      runCount: 1,
      totalPayable: '5300.00',
      totalPaid: '3000.00',
      totalRemaining: '2300.00',
    },
  ],
};

describe('buildPayrollRunsScopeStatsCsvContent', () => {
  it('includes header, meta, scope totals, and by_status rows', () => {
    const csv = buildPayrollRunsScopeStatsCsvContent(SAMPLE_STATS, META);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('section,col1,col2,col3,col4,col5');
    expect(lines).toContain('meta,exportedAt,2026-04-29T12:00:00.000Z,,,');
    expect(lines).toContain('meta,statusFilter,APPROVED,,,');
    expect(lines).toContain('meta,payrollMonthFrom,2026-01,,,');
    expect(lines).toContain('meta,payrollMonthTo,2026-03,,,');
    expect(lines).toContain('scope_totals,runCount,2,,,');
    expect(lines).toContain('scope_totals,totalRemaining,7300.00,,,');
    expect(lines).toContain('by_status,APPROVED,1,5000.00,0.00,5000.00');
    expect(lines).toContain('by_status,CLOSED,1,5300.00,3000.00,2300.00');
  });

  it('escapes commas in meta values', () => {
    const meta: PayrollRunsScopeStatsCsvFilterMeta = {
      ...META,
      payrollMonthFrom: '2026-01,note',
    };
    const csv = buildPayrollRunsScopeStatsCsvContent(SAMPLE_STATS, meta);
    expect(csv).toContain('"2026-01,note"');
  });
});
