import { describe, expect, it } from 'vitest';
import { formatDisableImpact, isDisableImpactConfirmReady } from './disable-impact';

describe('formatDisableImpact', () => {
  it('lists dependent policy and agent names', () => {
    expect(
      formatDisableImpact({
        kind: 'model',
        id: 'm1',
        policies: [{ id: 'p1', name: 'Chat', status: 'ACTIVE' }],
        agents: [{ id: 'a1', name: 'Inbox', status: 'ACTIVE' }],
      }),
    ).toBe('Policies (1): Chat. Internal Agents (1): Inbox.');
  });

  it('blocks confirm while impact is refetching', () => {
    expect(isDisableImpactConfirmReady({ hasData: true, isError: false, isFetching: true })).toBe(
      false,
    );
    expect(isDisableImpactConfirmReady({ hasData: true, isError: false, isFetching: false })).toBe(
      true,
    );
  });

  it('says when nothing depends on the target', () => {
    expect(formatDisableImpact({ kind: 'policy', id: 'p1', policies: [], agents: [] })).toBe(
      'No Model Policies or Internal Agents currently depend on this.',
    );
  });
});
