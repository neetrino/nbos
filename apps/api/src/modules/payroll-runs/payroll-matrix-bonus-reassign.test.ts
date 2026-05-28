import { describe, expect, it, vi } from 'vitest';
import { reassignMatrixBonusRecipient } from './payroll-matrix-bonus-reassign';

describe('reassignMatrixBonusRecipient', () => {
  it('rejects when bonus already paid', async () => {
    const tx = {
      bonusEntry: {
        findFirst: vi.fn().mockResolvedValue({ id: 'be1', projectId: 'p1', employeeId: 'e1' }),
      },
      bonusRelease: {
        count: vi.fn().mockResolvedValue(1),
      },
    };

    await expect(
      reassignMatrixBonusRecipient(tx as never, {
        payrollRunId: 'run1',
        fromEmployeeId: 'e1',
        orderId: 'o1',
        toEmployeeId: 'e2',
        reason: 'Wrong assignee',
      }),
    ).rejects.toThrow(/after payment/i);
  });

  it('requires salary line for new recipient', async () => {
    const tx = {
      bonusEntry: {
        findFirst: vi.fn().mockResolvedValue({ id: 'be1', projectId: 'p1', employeeId: 'e1' }),
      },
      bonusRelease: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn(),
      },
      salaryLine: { findUnique: vi.fn().mockResolvedValue(null) },
    };

    await expect(
      reassignMatrixBonusRecipient(tx as never, {
        payrollRunId: 'run1',
        fromEmployeeId: 'e1',
        orderId: 'o1',
        toEmployeeId: 'e2',
        reason: 'Handover',
      }),
    ).rejects.toThrow(/salary line/i);
  });
});
