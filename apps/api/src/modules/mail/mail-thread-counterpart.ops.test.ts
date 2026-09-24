import { describe, expect, it } from 'vitest';
import { resolveMailThreadCounterpart } from './mail-thread-counterpart.ops';

describe('resolveMailThreadCounterpart', () => {
  it('returns nulls when there is no message', () => {
    expect(resolveMailThreadCounterpart(null)).toEqual({ email: null, displayName: null });
    expect(resolveMailThreadCounterpart(undefined)).toEqual({ email: null, displayName: null });
  });

  it('uses From for inbound messages', () => {
    expect(
      resolveMailThreadCounterpart({
        direction: 'INBOUND',
        recipients: [
          { kind: 'FROM', email: 'client@example.com', displayName: 'Client' },
          { kind: 'TO', email: 'support@neetrino.com', displayName: null },
        ],
      }),
    ).toEqual({ email: 'client@example.com', displayName: 'Client' });
  });

  it('uses first To for outbound messages', () => {
    expect(
      resolveMailThreadCounterpart({
        direction: 'OUTBOUND',
        recipients: [
          { kind: 'FROM', email: 'support@neetrino.com', displayName: null },
          { kind: 'TO', email: 'lead@example.com', displayName: 'Lead' },
        ],
      }),
    ).toEqual({ email: 'lead@example.com', displayName: 'Lead' });
  });
});
