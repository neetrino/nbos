import { describe, expect, it, vi } from 'vitest';
import {
  normalizeMailboxEmail,
  resolveCorporateReconnectSettings,
  upsertCorporateMailboxDraft,
} from './mail-connect-corporate.ops';

describe('corporate mailbox reconnect settings', () => {
  it('normalizes mailbox email for upsert lookup', () => {
    expect(normalizeMailboxEmail('  Test@Neetrino.com ')).toBe('test@neetrino.com');
  });

  it('fills omitted fields from the stored connection', () => {
    const resolved = resolveCorporateReconnectSettings({
      account: { emailAddress: 'test@neetrino.com', displayName: 'Test' },
      connection: {
        username: 'test@neetrino.com',
        imapHost: 'imap.beget.com',
        imapPort: 993,
        secureMode: 'SSL',
        smtpHost: 'smtp.beget.com',
        smtpPort: 465,
        smtpSecureMode: 'SSL',
      },
      patch: { imapPort: 143 },
    });
    expect(resolved).toEqual(
      expect.objectContaining({
        email: 'test@neetrino.com',
        imapHost: 'imap.beget.com',
        imapPort: 143,
        smtpHost: 'smtp.beget.com',
        smtpPort: 465,
        login: 'test@neetrino.com',
      }),
    );
  });

  it('rejects reconnect when required host settings are missing', () => {
    const resolved = resolveCorporateReconnectSettings({
      account: { emailAddress: 'test@neetrino.com', displayName: null },
      connection: null,
      patch: {},
    });
    expect(resolved).toEqual({
      error: 'Mailbox settings are incomplete. Fill the missing fields and reconnect.',
    });
  });
});

const corporateDto = {
  email: '  Test@Neetrino.com ',
  displayName: 'Test',
  imapHost: 'imap.beget.com',
  imapPort: 993,
  imapSecure: 'SSL',
  smtpHost: 'smtp.beget.com',
  smtpPort: 465,
  smtpSecure: 'SSL',
  login: 'test@neetrino.com',
};

describe('upsertCorporateMailboxDraft uniqueness', () => {
  it('reuses a DISABLED mailbox for the same owner and email', async () => {
    const disabled = {
      id: 'acc-disabled',
      ownerEmployeeId: 'owner-1',
      status: 'DISABLED',
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      providerConnection: null,
    };
    const updated = { ...disabled, status: 'NEEDS_RECONNECT' };
    const prisma = {
      mailAccount: {
        findMany: vi.fn().mockResolvedValue([disabled]),
        update: vi.fn().mockResolvedValue(updated),
        create: vi.fn(),
      },
    };
    const result = await upsertCorporateMailboxDraft(prisma as never, 'owner-1', corporateDto);
    expect(result.id).toBe('acc-disabled');
    expect(prisma.mailAccount.create).not.toHaveBeenCalled();
    expect(prisma.mailAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acc-disabled' },
        data: expect.objectContaining({
          emailAddress: 'test@neetrino.com',
          providerType: 'CORPORATE_IMAP_SMTP',
          status: 'NEEDS_RECONNECT',
        }),
      }),
    );
  });
});
