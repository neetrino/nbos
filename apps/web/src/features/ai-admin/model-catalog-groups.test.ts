import { describe, expect, it } from 'vitest';
import { AI_ADMIN_POLICY_MODES } from './constants';
import { groupModelsForAdmin, productionEligibleModels } from './model-catalog-groups';
import type { AiModelView } from '@/lib/api/ai-admin';

function model(status: AiModelView['status'], id: string): AiModelView {
  return {
    id,
    connectionId: 'c1',
    provider: 'OPENAI',
    providerModelId: id,
    displayName: id,
    status,
    discoveredAt: '',
    lastSeenAt: '',
    providerMetadata: {},
    suitabilityTags: [],
    notes: null,
    aliasOf: null,
    snapshotId: null,
    activatedAt: null,
    createdAt: '',
    updatedAt: '',
  };
}

describe('model catalog grouping', () => {
  it('keeps DISCOVERED separate from ACTIVE', () => {
    const groups = groupModelsForAdmin([
      model('DISCOVERED', 'new'),
      model('ACTIVE', 'live'),
      model('DISABLED', 'off'),
    ]);
    expect(groups.discovered.map((item) => item.id)).toEqual(['new']);
    expect(groups.active.map((item) => item.id)).toEqual(['live']);
    expect(
      productionEligibleModels(
        [...groups.discovered, ...groups.active],
        [
          {
            id: 'c1',
            provider: 'OPENAI',
            name: 'OpenAI',
            status: 'ACTIVE',
            keyPrefix: 'sk-…',
            providerOrganizationId: null,
            providerProjectId: null,
            baseUrl: null,
            lastValidatedAt: null,
            lastModelSyncAt: null,
            createdById: 'e1',
            createdAt: '',
            updatedAt: '',
          },
        ],
      ),
    ).toEqual(groups.active);
  });

  it('excludes ACTIVE models whose provider connection is not ACTIVE', () => {
    expect(
      productionEligibleModels(
        [model('ACTIVE', 'live')],
        [
          {
            id: 'c1',
            provider: 'OPENAI',
            name: 'OpenAI',
            status: 'DISABLED',
            keyPrefix: 'sk-…',
            providerOrganizationId: null,
            providerProjectId: null,
            baseUrl: null,
            lastValidatedAt: null,
            lastModelSyncAt: null,
            createdById: 'e1',
            createdAt: '',
            updatedAt: '',
          },
        ],
      ),
    ).toEqual([]);
  });

  it('does not expose TIERED or ADAPTIVE in the admin policy UI', () => {
    expect(AI_ADMIN_POLICY_MODES).toEqual(['FIXED', 'PRIMARY_FALLBACK']);
  });
});
