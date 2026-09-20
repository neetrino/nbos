import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { applyEmployeeReplacement } from './apply-employee-replacement';

function buildDb(components: Array<Record<string, unknown>>) {
  return {
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
        components,
      }),
    },
  };
}

const heldByOldEmployee = {
  id: 'comp-base-be',
  roleKey: 'BACKEND',
  amount: '100000.00',
  allocations: [{ id: 'alloc-1', employeeId: 'emp-old' }],
};

function replacementInput(shares: Array<Record<string, string>>) {
  return {
    configurationId: 'cfg-1',
    roleKey: 'BACKEND' as const,
    fromEmployeeId: 'emp-old',
    toEmployeeId: 'emp-new',
    shares: shares as never,
    reason: 'handover',
    actorEmployeeId: 'actor-1',
    expectedRevision: 1,
  };
}

describe('applyEmployeeReplacement', () => {
  it('rejects empty share fields after the plan exists (H04)', async () => {
    const db = buildDb([heldByOldEmployee]);

    await expect(
      applyEmployeeReplacement(
        db as never,
        replacementInput([
          { componentId: 'comp-base-be', outgoingPercent: '', incomingPercent: '' },
        ]),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires percents only for components the outgoing employee holds', async () => {
    const db = {
      ...buildDb([
        heldByOldEmployee,
        {
          id: 'comp-feature-be',
          roleKey: 'BACKEND',
          amount: '40000.00',
          allocations: [{ id: 'alloc-2', employeeId: 'emp-other' }],
        },
      ]),
      deliveryConfigurationRevision: {
        create: vi.fn().mockRejectedValue(new Error('validation passed')),
      },
    };

    // A share for the held component only must clear validation and reach the revision write,
    // instead of being rejected for not covering the component held by someone else.
    await expect(
      applyEmployeeReplacement(
        db as never,
        replacementInput([
          { componentId: 'comp-base-be', outgoingPercent: '60', incomingPercent: '40' },
        ]),
      ),
    ).rejects.toThrow('validation passed');
  });

  it('refuses a replacement when the outgoing employee holds nothing in this role', async () => {
    const db = buildDb([
      {
        id: 'comp-feature-be',
        roleKey: 'BACKEND',
        amount: '40000.00',
        allocations: [{ id: 'alloc-2', employeeId: 'emp-other' }],
      },
    ]);

    await expect(
      applyEmployeeReplacement(
        db as never,
        replacementInput([
          { componentId: 'comp-feature-be', outgoingPercent: '60', incomingPercent: '40' },
        ]),
      ),
    ).rejects.toMatchObject({ response: { code: 'ROLE_ASSIGNMENT_REQUIRED' } });
  });
});
