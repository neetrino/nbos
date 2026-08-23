import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION } from '../ai-platform.constants';
import { AiModelPolicyService } from './ai-model-policy.service';

const ACTOR_ID = 'emp-admin';

function policyRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'policy-1',
    name: 'Client Support',
    purpose: 'support',
    mode: 'FIXED',
    status: 'DRAFT',
    version: 1,
    createdById: ACTOR_ID,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    candidates: [],
    ...overrides,
  };
}

function activeModel(id: string, connectionStatus = 'ACTIVE') {
  return {
    id,
    status: 'ACTIVE',
    connection: { status: connectionStatus },
  };
}

describe('AiModelPolicyService', () => {
  let prisma: MockPrisma;
  let audit: AiPlatformAuditService;
  let service: AiModelPolicyService;

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = {
      logAdminAction: vi.fn(),
      logMachineAction: vi.fn(),
    } as unknown as AiPlatformAuditService;
    service = new AiModelPolicyService(prisma as never, audit);
  });

  it('creates a FIXED policy with one active model', async () => {
    prisma.aiModel.findUnique.mockResolvedValue(activeModel('model-1'));
    prisma.aiModelPolicy.create.mockResolvedValue(policyRow());
    prisma.aiModelPolicy.findUniqueOrThrow.mockResolvedValue(
      policyRow({
        candidates: [
          { id: 'c-1', modelId: 'model-1', role: 'PRIMARY', priority: 0, enabled: true },
        ],
      }),
    );

    const view = await service.create(
      {
        name: 'Client Support',
        mode: 'FIXED',
        candidates: [{ modelId: 'model-1', role: 'PRIMARY', priority: 0 }],
      },
      ACTOR_ID,
    );
    expect(view.mode).toBe('FIXED');
    expect(view.candidates).toHaveLength(1);
  });

  it('creates a cross-provider PRIMARY_FALLBACK policy', async () => {
    prisma.aiModel.findUnique
      .mockResolvedValueOnce(activeModel('openai-1'))
      .mockResolvedValueOnce(activeModel('anthropic-1'));
    prisma.aiModelPolicy.create.mockResolvedValue(policyRow({ mode: 'PRIMARY_FALLBACK' }));
    prisma.aiModelPolicy.findUniqueOrThrow.mockResolvedValue(
      policyRow({
        mode: 'PRIMARY_FALLBACK',
        candidates: [
          { id: 'c-1', modelId: 'openai-1', role: 'PRIMARY', priority: 0, enabled: true },
          { id: 'c-2', modelId: 'anthropic-1', role: 'FALLBACK', priority: 1, enabled: true },
        ],
      }),
    );
    const view = await service.create(
      {
        name: 'Support Fallback',
        mode: 'PRIMARY_FALLBACK',
        candidates: [
          { modelId: 'openai-1', role: 'PRIMARY', priority: 0 },
          { modelId: 'anthropic-1', role: 'FALLBACK', priority: 1 },
        ],
      },
      ACTOR_ID,
    );
    expect(view.mode).toBe('PRIMARY_FALLBACK');
    expect(view.candidates.map((item) => item.modelId)).toEqual(['openai-1', 'anthropic-1']);
  });

  it('refuses TIERED/ADAPTIVE and DISCOVERED production candidates', async () => {
    await expect(
      service.create({ name: 'Adaptive', mode: 'ADAPTIVE', candidates: [] }, ACTOR_ID),
    ).rejects.toThrow(BadRequestException);
    prisma.aiModel.findUnique.mockResolvedValue({
      id: 'model-1',
      status: 'DISCOVERED',
      connection: { status: 'ACTIVE' },
    });
    await expect(
      service.create(
        {
          name: 'Too Soon',
          mode: 'FIXED',
          candidates: [{ modelId: 'model-1', role: 'PRIMARY', priority: 0 }],
        },
        ACTOR_ID,
      ),
    ).rejects.toThrow(/DISCOVERED|production/);
  });

  it('increments version when candidates change', async () => {
    prisma.aiModelPolicy.findUnique.mockResolvedValue(policyRow());
    prisma.aiModel.findUnique.mockResolvedValue(activeModel('model-2'));
    prisma.aiModelPolicy.findUniqueOrThrow.mockResolvedValue(
      policyRow({
        version: 2,
        candidates: [
          { id: 'c-2', modelId: 'model-2', role: 'PRIMARY', priority: 0, enabled: true },
        ],
      }),
    );
    const view = await service.replaceCandidates(
      'policy-1',
      [{ modelId: 'model-2', role: 'PRIMARY', priority: 0 }],
      ACTOR_ID,
    );
    expect(prisma.aiModelPolicy.update).toHaveBeenCalledWith({
      where: { id: 'policy-1' },
      data: { version: { increment: 1 } },
    });
    expect(view.version).toBe(2);
    expect(audit.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: AI_AUDIT_ACTION.modelPolicyUpdated }),
      prisma,
    );
  });

  it('refuses inverted PRIMARY_FALLBACK and a disabled PRIMARY', async () => {
    await expect(
      service.create(
        {
          name: 'Inverted',
          mode: 'PRIMARY_FALLBACK',
          candidates: [
            { modelId: 'fallback', role: 'FALLBACK', priority: 0 },
            { modelId: 'primary', role: 'PRIMARY', priority: 10 },
          ],
        },
        ACTOR_ID,
      ),
    ).rejects.toThrow(/lowest priority/i);
    await expect(
      service.create(
        {
          name: 'Disabled Primary',
          mode: 'PRIMARY_FALLBACK',
          candidates: [
            { modelId: 'primary', role: 'PRIMARY', priority: 0, enabled: false },
            { modelId: 'fallback', role: 'FALLBACK', priority: 1 },
          ],
        },
        ACTOR_ID,
      ),
    ).rejects.toThrow(/enabled PRIMARY/);
  });

  it('treats an ACTIVE policy with an unavailable fallback as assignable when PRIMARY is healthy', async () => {
    prisma.aiModelPolicy.findUnique.mockResolvedValue(
      policyRow({
        status: 'ACTIVE',
        mode: 'PRIMARY_FALLBACK',
        candidates: [
          { id: 'c-1', modelId: 'openai-1', role: 'PRIMARY', priority: 0, enabled: true },
          { id: 'c-2', modelId: 'anthropic-1', role: 'FALLBACK', priority: 1, enabled: true },
        ],
      }),
    );
    prisma.aiModel.findUnique.mockResolvedValue(activeModel('openai-1'));
    const view = await service.requireAssignableForProduction('policy-1');
    expect(view.status).toBe('ACTIVE');
    expect(prisma.aiModel.findUnique).toHaveBeenCalledTimes(1);
  });
});
