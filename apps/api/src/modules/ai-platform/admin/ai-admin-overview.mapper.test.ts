import { describe, expect, it } from 'vitest';
import { toOverviewCounts } from './ai-admin-overview.mapper';

describe('toOverviewCounts', () => {
  it('counts agent states and attention items', () => {
    const result = toOverviewCounts(
      [
        { id: 'a1', name: 'Live', state: 'ACTIVE' },
        { id: 'a2', name: 'Off', state: 'DISABLED' },
        { id: 'a3', name: 'Dead', state: 'REVOKED' },
      ] as never,
      [{ id: 'p1', name: 'OpenAI', status: 'ACTIVE' }] as never,
      [{ id: 'pol1', status: 'ACTIVE' }] as never,
    );

    expect(result.externalAgents).toEqual({
      total: 3,
      active: 1,
      disabled: 1,
      revoked: 1,
      expired: 0,
    });
    expect(result.attention.map((item) => item.id)).toEqual(['a2', 'a3']);
    expect(result.providers.active).toBe(1);
    expect(result.modelPolicies.active).toBe(1);
  });
});
