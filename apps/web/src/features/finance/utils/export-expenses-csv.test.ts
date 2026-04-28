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
    status: 'THIS_MONTH',
    projectId: null,
    isPassThrough: false,
    taxStatus: 'TAX',
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
});
