import { describe, expect, it } from 'vitest';
import { parseAtsWebhookBody } from './ats-webhook-body.parse';

describe('parseAtsWebhookBody', () => {
  it('maps form fields and ignores unknown keys', () => {
    expect(
      parseAtsWebhookBody({
        uid: '  u-1 ',
        state: 'start',
        calldirect: '0',
        clid: '099123456',
        record_link: 'https://example.com/r.wav',
        extra_ats_field: 'ignored',
      }),
    ).toEqual({
      uid: 'u-1',
      state: 'start',
      calldirect: '0',
      clid: '099123456',
      input: null,
      op: null,
      rate: null,
      billsec: null,
      disposition: null,
      channel: null,
      recordLink: 'https://example.com/r.wav',
    });
  });

  it('throws when uid is missing', () => {
    expect(() => parseAtsWebhookBody({ state: 'start' })).toThrow('UID_REQUIRED');
  });
});
