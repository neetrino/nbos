import { describe, expect, it } from 'vitest';
import { mailInboxThreadCountWhere, mailThreadListActivityWhere } from './mail-thread-list-where';

describe('mailThreadListActivityWhere', () => {
  it('lists threads that have an outbound DRAFT', () => {
    expect(mailThreadListActivityWhere({ draftsOnly: true })).toEqual({
      messages: { some: { direction: 'OUTBOUND', deliveryStatus: 'DRAFT' } },
    });
  });

  it('hides compose-only drafts from the default inbox', () => {
    expect(mailThreadListActivityWhere({})).toEqual({
      OR: [{ lastInboundAt: { not: null } }, { lastOutboundAt: { not: null } }],
    });
  });

  it('keeps Sent on lastOutboundAt', () => {
    expect(mailThreadListActivityWhere({ sentOnly: true })).toEqual({
      lastOutboundAt: { not: null },
    });
  });
});

describe('mailInboxThreadCountWhere', () => {
  it('matches All-inbox visibility', () => {
    expect(mailInboxThreadCountWhere(['acc-1'])).toEqual({
      mailAccountId: { in: ['acc-1'] },
      isSpam: false,
      trashedAt: null,
      OR: [{ lastInboundAt: { not: null } }, { lastOutboundAt: { not: null } }],
    });
  });
});
