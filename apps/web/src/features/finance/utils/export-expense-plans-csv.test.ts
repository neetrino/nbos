import { describe, expect, it } from 'vitest';
import { buildExpensePlansCsvContent } from '@/features/finance/utils/export-expense-plans-csv';
import type { ExpensePlan } from '@/lib/api/expense-plans';

const PLAN_A: ExpensePlan = {
  id: 'p-1',
  name: 'Rent',
  category: 'facilities',
  amount: '100.50',
  frequency: 'MONTHLY',
  nextDueDate: '2026-05-01T00:00:00.000Z',
  provider: 'ACME',
  projectId: 'proj-1',
  autoGenerate: true,
  notes: 'Line1\nLine2',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-02T00:00:00.000Z',
  project: { id: 'proj-1', code: 'P1', name: 'Project One' },
  _count: { expenses: 2 },
};

describe('buildExpensePlansCsvContent', () => {
  it('returns header only when no rows', () => {
    expect(buildExpensePlansCsvContent([])).toBe(
      'id,name,category,amount,frequency,frequencyLabel,autoGenerate,nextDueDate,provider,projectId,projectCode,projectName,linkedExpenseCount,notes,createdAt,updatedAt',
    );
  });

  it('includes data rows, escapes notes, and trailing grand total', () => {
    const csv = buildExpensePlansCsvContent([PLAN_A]);
    expect(csv).toContain('MONTHLY,Monthly,true');
    expect(csv).toContain('"Line1\nLine2"');
    expect(csv).toContain('_grand_total');
    expect(csv).toContain('100.50');
    expect(csv).toContain(',2,');
  });
});
