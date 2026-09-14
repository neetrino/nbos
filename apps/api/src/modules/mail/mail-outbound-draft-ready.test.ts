import { describe, expect, it } from 'vitest';
import { outboundDraftSendBlocker } from './mail-outbound-draft-ready';

describe('outboundDraftSendBlocker', () => {
  it('requires a To address and a subject', () => {
    expect(
      outboundDraftSendBlocker({
        subject: 'Hello',
        recipients: [{ kind: 'FROM' }],
      }),
    ).toBe('Add at least one To address before sending.');
    expect(
      outboundDraftSendBlocker({
        subject: '  ',
        recipients: [{ kind: 'TO' }],
      }),
    ).toBe('Add a subject before sending.');
    expect(
      outboundDraftSendBlocker({
        subject: 'Hello',
        recipients: [{ kind: 'FROM' }, { kind: 'TO' }],
      }),
    ).toBeNull();
  });
});
