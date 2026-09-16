import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { syncOpenExpenseCredentialFromService } from './late-credential-sync';

describe('syncOpenExpenseCredentialFromService', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it('fills only open expenses that still have an empty credential', async () => {
    prisma.expense.updateMany.mockResolvedValue({ count: 2 });
    const count = await syncOpenExpenseCredentialFromService(prisma as never, 'svc-1', 'cred-1');
    expect(count).toBe(2);
    expect(prisma.expense.updateMany).toHaveBeenCalledWith({
      where: {
        clientServiceRecordId: 'svc-1',
        credentialId: null,
        status: { notIn: ['PAID', 'CANCELLED'] },
      },
      data: { credentialId: 'cred-1' },
    });
  });

  it('does nothing without a credential id', async () => {
    const count = await syncOpenExpenseCredentialFromService(prisma as never, 'svc-1', null);
    expect(count).toBe(0);
    expect(prisma.expense.updateMany).not.toHaveBeenCalled();
  });
});
