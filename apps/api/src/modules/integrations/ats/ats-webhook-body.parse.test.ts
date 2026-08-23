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
      input: undefined,
      op: undefined,
      rate: undefined,
      billsec: undefined,
      disposition: undefined,
      channel: undefined,
      recordLink: 'https://example.com/r.wav',
    });
  });

  it('preserves absence versus explicit empty at the DTO boundary', () => {
    expect(parseAtsWebhookBody({ uid: 'u-1', clid: '' })).toEqual({
      uid: 'u-1',
      state: undefined,
      input: undefined,
      clid: null,
      op: undefined,
      rate: undefined,
      billsec: undefined,
      calldirect: undefined,
      disposition: undefined,
      channel: undefined,
      recordLink: undefined,
    });
  });

  it('throws when uid is missing', () => {
    expect(() => parseAtsWebhookBody({ state: 'start' })).toThrow('UID_REQUIRED');
  });
});
