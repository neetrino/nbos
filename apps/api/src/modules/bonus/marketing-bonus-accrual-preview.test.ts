import { describe, expect, it, vi } from 'vitest';

import { createMockPrisma } from '../../test-utils/mock-prisma';

import { queryMarketingBonusAccrualPreview } from './marketing-bonus-accrual-preview';

describe('queryMarketingBonusAccrualPreview', () => {
  it('aggregates MQL/SQL counts per assignee', async () => {
    const prisma = createMockPrisma();
    prisma.lead.groupBy.mockResolvedValue([
      { assignedTo: 'e1', status: 'MQL', _count: { _all: 2 } },
      { assignedTo: 'e1', status: 'SQL', _count: { _all: 1 } },
      { assignedTo: 'e2', status: 'SQL', _count: { _all: 3 } },
    ]);
    prisma.employee.findMany.mockResolvedValue([
      { id: 'e1', firstName: 'Ann', lastName: 'Lee' },
      { id: 'e2', firstName: 'Bob', lastName: 'Kim' },
    ]);

    const preview = await queryMarketingBonusAccrualPreview(prisma as never, '2026-05');

    expect(preview.payrollMonth).toBe('2026-05');
    expect(preview.totals.mqlCount).toBe(2);
    expect(preview.totals.sqlCount).toBe(4);
    expect(preview.rows).toHaveLength(2);
    expect(preview.rows[0]?.employeeId).toBe('e2');
    expect(preview.rows[1]?.sqlCount).toBe(1);
  });
});
