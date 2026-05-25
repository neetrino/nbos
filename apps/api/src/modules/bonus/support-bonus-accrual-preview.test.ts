import { describe, expect, it, vi } from 'vitest';

import { createMockPrisma } from '../../test-utils/mock-prisma';

import { querySupportBonusAccrualPreview } from './support-bonus-accrual-preview';

describe('querySupportBonusAccrualPreview', () => {
  it('counts SLA-met tickets per assignee in payroll month', async () => {
    const prisma = createMockPrisma();
    prisma.supportTicket.findMany.mockResolvedValue([
      {
        assignedTo: 'e1',
        status: 'RESOLVED',
        updatedAt: new Date(Date.UTC(2026, 4, 15)),
        slaResolveDeadline: new Date(Date.UTC(2026, 4, 20)),
      },
      {
        assignedTo: 'e1',
        status: 'CLOSED',
        updatedAt: new Date(Date.UTC(2026, 4, 8)),
        slaResolveDeadline: new Date(Date.UTC(2026, 4, 10)),
      },
      {
        assignedTo: 'e2',
        status: 'RESOLVED',
        updatedAt: new Date(Date.UTC(2026, 4, 25)),
        slaResolveDeadline: new Date(Date.UTC(2026, 4, 28)),
      },
    ]);
    prisma.employee.findMany.mockResolvedValue([
      { id: 'e1', firstName: 'A', lastName: 'B' },
      { id: 'e2', firstName: 'C', lastName: 'D' },
    ]);

    const preview = await querySupportBonusAccrualPreview(prisma as never, '2026-05');

    expect(preview.totals.slaMetCount).toBe(3);
    expect(preview.rows.find((r) => r.employeeId === 'e1')?.slaMetCount).toBe(2);
    expect(preview.rows.find((r) => r.employeeId === 'e2')?.slaMetCount).toBe(1);
  });
});
