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

  it('uses input for outbound when present', () => {
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
