import { describe, expect, it } from 'vitest';
import {
  normalizeMailboxEmail,
  resolveCorporateReconnectSettings,
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
