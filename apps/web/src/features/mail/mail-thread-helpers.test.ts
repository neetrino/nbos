import { describe, expect, it } from 'vitest';
import { isMailComposeOnlyDraftThread, latestOutboundDraftMessage } from './mail-thread-helpers';
import type { MailMessageRow } from '@/lib/api/mail';

function message(partial: Partial<MailMessageRow> & Pick<MailMessageRow, 'id'>): MailMessageRow {
  return {
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

describe('latestOutboundDraftMessage', () => {
  it('returns the newest outbound DRAFT', () => {
    const draft = message({
      id: 'd2',
      direction: 'OUTBOUND',
      deliveryStatus: 'DRAFT',
    });
    expect(
      latestOutboundDraftMessage([
        message({ id: 'in' }),
        message({ id: 'd1', direction: 'OUTBOUND', deliveryStatus: 'DRAFT' }),
        draft,
      ]),
    ).toBe(draft);
  });
});

describe('isMailComposeOnlyDraftThread', () => {
  it('treats missing inbound as a compose-only draft thread', () => {
    expect(isMailComposeOnlyDraftThread({ lastInboundAt: null })).toBe(true);
    expect(isMailComposeOnlyDraftThread({ lastInboundAt: '2026-01-01T00:00:00.000Z' })).toBe(false);
  });
});
