import { describe, expect, it } from 'vitest';
import { mailInitialsFromLabel, messageSenderLabel, messageTimestampIso } from './mail-format';
import type { MailMessageRow } from '@/lib/api/mail';

function message(partial: Partial<MailMessageRow>): MailMessageRow {
  return {
    id: 'm1',
    direction: 'INBOUND',
    subject: '',
    bodyText: null,
    bodyHtmlSanitized: null,
    sentAt: null,
    receivedAt: null,
    readState: 'READ',
    deliveryStatus: null,
    recipients: [],
    attachments: [],
    ...partial,
  };
}

describe('mailInitialsFromLabel', () => {
  it('uses two letters from a display name', () => {
    expect(mailInitialsFromLabel('Alen Varosyan')).toBe('AV');
  });

  it('uses the local part of an email', () => {
    expect(mailInitialsFromLabel('alen@neetrino.com')).toBe('AL');
  });
});

describe('messageSenderLabel', () => {
  it('prefers FROM display name', () => {
    expect(
      messageSenderLabel(
        message({
          recipients: [{ kind: 'FROM', email: 'a@x.com', displayName: 'Ada' }],
        }),
      ),
    ).toBe('Ada');
  });

  it('falls back to You for outbound without FROM', () => {
    expect(messageSenderLabel(message({ direction: 'OUTBOUND' }))).toBe('You');
  });
});

describe('messageTimestampIso', () => {
  it('prefers sentAt then receivedAt', () => {
    expect(messageTimestampIso(message({ sentAt: 's', receivedAt: 'r' }))).toBe('s');
    expect(messageTimestampIso(message({ receivedAt: 'r' }))).toBe('r');
  });
});
