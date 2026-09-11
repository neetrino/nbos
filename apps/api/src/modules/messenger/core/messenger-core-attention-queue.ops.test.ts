import { describe, expect, it, vi } from 'vitest';
import { listAttentionQueueEmployeeIds } from './messenger-core-attention-queue.ops';

describe('listAttentionQueueEmployeeIds', () => {
  it('does not put FINANCE_INVOICES VIEW ALL without EDIT ALL on the Finance queue', async () => {
    const prisma = {
      employee: { findMany: vi.fn().mockResolvedValue([{ id: 'finance-editor' }]) },
    };
    const ids = await listAttentionQueueEmployeeIds(prisma as never, 'FINANCE');
    expect(ids).toEqual(['finance-editor']);
    expect(prisma.employee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: {
            permissions: {
              some: {
                scope: 'ALL',
                permission: { module: 'FINANCE_INVOICES', action: 'EDIT' },
              },
            },
          },
        }),
      }),
    );
    expect(prisma.employee.findMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: {
            permissions: {
              some: {
                permission: { module: 'FINANCE_INVOICES', action: 'VIEW' },
              },
            },
          },
        }),
      }),
    );
  });

  it('uses SUPPORT_TICKETS EDIT ALL for Support Intake membership', async () => {
    const prisma = {
      employee: { findMany: vi.fn().mockResolvedValue([{ id: 'support-editor' }]) },
    };
    await listAttentionQueueEmployeeIds(prisma as never, 'SUPPORT_INTAKE');
    expect(prisma.employee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: {
            permissions: {
              some: {
                scope: 'ALL',
                permission: { module: 'SUPPORT_TICKETS', action: 'EDIT' },
              },
            },
          },
        }),
      }),
    );
  });
});
