import { describe, expect, it } from 'vitest';
import { buildExpensesCsvContent } from './export-expenses-csv';
import type { Expense } from '@/lib/api/finance';

function minimalExpense(overrides: Partial<Expense>): Expense {
  return {
    id: 'e1',
    type: 'PLANNED',
    category: 'TOOLS',
    name: 'Test',
    amount: '100.00',
    frequency: 'ONE_TIME',
    dueDate: null,
    status: 'PLANNED',
    projectId: null,
    isPassThrough: false,
    taxStatus: 'TAX',
    backlogReason: null,
    notes: null,
    createdAt: '2026-04-28T12:00:00.000Z',
    ...overrides,
  };
}

describe('buildExpensesCsvContent', () => {
  it('includes header and escapes commas and quotes in fields', () => {
    const csv = buildExpensesCsvContent([
      minimalExpense({
        name: 'Acme, LLC "beta"',
        notes: 'Line1\nLine2',
      }),
    ]);
    expect(csv).toContain('name');
    expect(csv).toContain('"Acme, LLC ""beta"""');
    expect(csv).toContain('"Line1\nLine2"');
  });

  it('serializes project fields when present', () => {
    const csv = buildExpensesCsvContent([
      minimalExpense({
        project: { id: 'p1', code: 'PRJ-1', name: 'Alpha' },
      }),
    ]);
    expect(csv).toContain('PRJ-1');
    expect(csv).toContain('Alpha');
  });

  it('includes payroll run id and month from linkedPayrollRun', () => {
    const csv = buildExpensesCsvContent([
      minimalExpense({
        linkedPayrollRun: {
          payrollRunId: 'run-1',
          payrollMonth: '2026-05',
          salaryLineId: 'sl-1',
        },
      }),
    ]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toContain('payrollRunId');
    expect(lines[0]).toContain('payrollMonth');
    expect(lines[1]).toContain('run-1');
    expect(lines[1]).toContain('2026-05');
  });

  it('appends grand total row summing money columns', () => {
    const csv = buildExpensesCsvContent([
      minimalExpense({ id: 'a', amount: '10.00', paidAmount: '4.00', remainingAmount: '6.00' }),
      minimalExpense({ id: 'b', amount: '20.50', paidAmount: '0.50', remainingAmount: '20.00' }),
    ]);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(4);
    expect(lines[3]).toContain('_grand_total');
    expect(lines[3]).toContain('All expenses (2)');
    expect(lines[3]).toContain('30.50');
    expect(lines[3]).toContain('4.50');
    expect(lines[3]).toContain('26.00');
  });

  it('header only when no rows', () => {
    expect(buildExpensesCsvContent([])).toMatch(/^id,/);
    expect(buildExpensesCsvContent([]).split('\r\n')).toHaveLength(1);
  });
});
