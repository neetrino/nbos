import { describe, expect, it } from 'vitest';
import { resolveAtsClientPhone } from './ats-call-client-phone';
import { inboundStart } from './ats-call.test-harness';

describe('resolveAtsClientPhone', () => {
  it('uses clid for inbound', () => {
    expect(resolveAtsClientPhone(inboundStart())).toEqual({
      raw: '+37499123456',
      source: 'clid',
    });
  });

  it('uses input for outbound when op is a SIP extension', () => {
    expect(
      resolveAtsClientPhone(
        inboundStart({
          calldirect: '1',
          clid: '3103585',
          input: '37499123456',
          op: '3103585',
        }),
      ),
    ).toEqual({ raw: '37499123456', source: 'input' });
  });

  it('uses op for outbound when op is the dialed client phone', () => {
    expect(
      resolveAtsClientPhone(
        inboundStart({
          calldirect: '1',
          clid: '3103581',
          input: '37444343000',
          op: '37444343019',
        }),
      ),
    ).toEqual({ raw: '37444343019', source: 'op' });
  });

  it('falls back to clid for outbound when input is absent', () => {
    expect(
      resolveAtsClientPhone(
        inboundStart({
          calldirect: '1',
          clid: '+37499123456',
          input: null,
        }),
      ),
    ).toEqual({ raw: '+37499123456', source: 'clid' });
  });
});
