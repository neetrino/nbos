import { describe, expect, it, vi } from 'vitest';
import { upsertGmailMailbox } from './mail-connect-gmail.ops';

describe('upsertGmailMailbox uniqueness', () => {
  it('reuses a DISABLED mailbox for the same owner and email', async () => {
    const disabled = {
      id: 'acc-gmail-off',
      ownerEmployeeId: 'owner-1',
      status: 'DISABLED',
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      providerConnection: null,
    };
    const prisma = {
      mailAccount: {
        findMany: vi.fn().mockResolvedValue([disabled]),
        update: vi.fn().mockResolvedValue({ ...disabled, status: 'ACTIVE' }),
        create: vi.fn(),
      },
    };
    const accountId = await upsertGmailMailbox(prisma as never, 'owner-1', '  Sales@Company.com ', [
      'https://www.googleapis.com/auth/gmail.modify',
    ]);
    expect(accountId).toBe('acc-gmail-off');
    expect(prisma.mailAccount.create).not.toHaveBeenCalled();
    expect(prisma.mailAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acc-gmail-off' },
        data: expect.objectContaining({
          emailAddress: 'sales@company.com',
          providerType: 'GMAIL',
          status: 'ACTIVE',
        }),
      }),
    );
  });
});
