import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { applyEmployeeReplacement } from './apply-employee-replacement';

describe('applyEmployeeReplacement', () => {
  it('rejects empty share fields after the plan exists (H04)', async () => {
    const db = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'cfg-1' }]),
      deliveryConfiguration: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cfg-1',
          mode: 'V2',
          initialRevisionId: 'rev-1',
          currentRevision: { sequence: 1 },
          orderId: 'order-1',
          productId: 'p-1',
          extensionId: null,
          order: { id: 'order-1', projectId: 'proj-1' },
          components: [
            { id: 'comp-base-be', roleKey: 'BACKEND', amount: '100000.00', allocations: [] },
          ],
        }),
      },
    };

    await expect(
      applyEmployeeReplacement(db as never, {
        configurationId: 'cfg-1',
        roleKey: 'BACKEND',
        fromEmployeeId: 'emp-old',
        toEmployeeId: 'emp-new',
        shares: [{ componentId: 'comp-base-be', outgoingPercent: '', incomingPercent: '' }],
        reason: 'handover',
        actorEmployeeId: 'actor-1',
        expectedRevision: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
