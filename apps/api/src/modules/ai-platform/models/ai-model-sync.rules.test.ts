import { describe, expect, it } from 'vitest';
import type { DiscoveredProviderModel } from '../providers/ai-provider.types';
import { planModelSync, statusAfterDisappear, statusAfterRefresh } from './ai-model-sync.rules';

function discovered(id: string): DiscoveredProviderModel {
  return {
    providerModelId: id,
    displayName: id,
    providerMetadata: { source: 'test' },
    aliasOf: null,
    snapshotId: null,
  };
}

describe('ai-model-sync.rules', () => {
  it('plans new models as creates and keeps existing ids for refresh', () => {
    const plan = planModelSync(
      [{ id: 'm-1', providerModelId: 'gpt-4o', status: 'ACTIVE' }],
      [discovered('gpt-4o'), discovered('gpt-5')],
    );
    expect(plan.create.map((item) => item.providerModelId)).toEqual(['gpt-5']);
    expect(plan.refresh).toHaveLength(1);
    expect(plan.disappear).toEqual([]);
  });

  it('never auto-activates a newly discovered or returning model', () => {
    expect(statusAfterRefresh('UNAVAILABLE')).toBe('DISCOVERED');
    expect(statusAfterRefresh('ACTIVE')).toBe('ACTIVE');
    expect(statusAfterRefresh('DISCOVERED')).toBe('DISCOVERED');
  });

  it('marks disappeared live models unavailable without deleting DISABLED/DEPRECATED', () => {
    expect(statusAfterDisappear('DISCOVERED')).toBe('UNAVAILABLE');
    expect(statusAfterDisappear('ACTIVE')).toBe('UNAVAILABLE');
    expect(statusAfterDisappear('DISABLED')).toBe('DISABLED');
    expect(statusAfterDisappear('DEPRECATED')).toBe('DEPRECATED');
    const plan = planModelSync([{ id: 'm-1', providerModelId: 'old', status: 'ACTIVE' }], []);
    expect(plan.disappear.map((item) => item.providerModelId)).toEqual(['old']);
  });
});
