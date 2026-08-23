import { describe, expect, it } from 'vitest';
import { shouldEnqueueCallRecording } from './ats-call-recording-should-enqueue';
import type { AtsWebhookPayload } from './ats.types';

function payload(overrides: Partial<AtsWebhookPayload>): AtsWebhookPayload {
  return {
    state: null,
    uid: 'uid-1',
    input: null,
    clid: null,
    op: null,
    rate: null,
    billsec: null,
    calldirect: null,
    disposition: null,
    channel: null,
    recordLink: null,
    ...overrides,
  };
}

describe('shouldEnqueueCallRecording', () => {
  it('skips non-terminal states', () => {
    expect(shouldEnqueueCallRecording(payload({ state: 'start' }))).toBe(false);
    expect(shouldEnqueueCallRecording(payload({ state: 'status' }))).toBe(false);
  });

  it('enqueues answered finish/end', () => {
    expect(shouldEnqueueCallRecording(payload({ state: 'finish', disposition: 'ANSWERED' }))).toBe(
      true,
    );
    expect(shouldEnqueueCallRecording(payload({ state: 'end', disposition: 'ANSWERED' }))).toBe(
      true,
    );
  });

  it('skips no-answer without a record link', () => {
    expect(shouldEnqueueCallRecording(payload({ state: 'finish', disposition: 'NO ANSWER' }))).toBe(
      false,
    );
  });

  it('enqueues when ATS provided a record link even for no-answer', () => {
    expect(
      shouldEnqueueCallRecording(
        payload({ state: 'finish', disposition: 'NO ANSWER', recordLink: 'https://ats/x' }),
      ),
    ).toBe(true);
  });
});
