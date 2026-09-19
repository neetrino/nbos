import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { applyScopeRemoveFeature } from './apply-scope-remove-feature';

describe('applyScopeRemoveFeature', () => {
  it('requires accepted amounts after the plan exists', async () => {
    const db = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'cfg-1' }]),
      deliveryConfiguration: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cfg-1',
          mode: 'V2',
          initialRevisionId: 'rev-1',
          draftVersion: 1,
          currentRevision: { sequence: 1 },
        }),
      },
      deliveryConfigurationFeature: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'feat-1',
          archivedAt: null,
          components: [
            {
              allocations: [
                {
                  id: 'alloc-1',
                  retainedAcceptedAmount: '0',
                  currentPlannedAmount: '1000.00',
                  bonusEntry: { id: 'be-1', bonusReleases: [] },
                },
              ],
            },
          ],
        }),
        update: vi.fn(),
      },
    };

    await expect(
      applyScopeRemoveFeature(db as never, {
        configurationId: 'cfg-1',
        featureId: 'feat-1',
        expectedRevision: 1,
        reason: 'cut scope',
        actorEmployeeId: 'actor-1',
        acceptedAmounts: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
