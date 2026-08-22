import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import { AiModelPolicyService } from '../policies/ai-model-policy.service';
import { AiPromptPolicyService } from '../prompts/ai-prompt-policy.service';
import { InternalAgentService } from './internal-agent.service';

const OWNER_ID = 'emp-owner';
const ACTOR_ID = 'emp-admin';

function agentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ia-1',
    name: 'Delivery Assistant',
    description: null,
    status: 'DRAFT',
    ownerId: OWNER_ID,
    createdById: ACTOR_ID,
    modelPolicyId: null,
    promptPolicyId: null,
    approvalPolicyId: null,
    environment: null,
    activatedAt: null,
    pausedAt: null,
    disabledAt: null,
    archivedAt: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    surfaces: [],
    ...overrides,
  };
}

function lockRow(prisma: MockPrisma, row: ReturnType<typeof agentRow>) {
  prisma.$queryRaw.mockResolvedValue([{ id: row.id }]);
  prisma.internalAiAgent.findUniqueOrThrow.mockResolvedValue(row);
}

describe('InternalAgentService', () => {
  let prisma: MockPrisma;
  let audit: AiPlatformAuditService;
  let policies: AiModelPolicyService;
  let prompts: AiPromptPolicyService;
  let service: InternalAgentService;

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = {
      logAdminAction: vi.fn(),
      logMachineAction: vi.fn(),
    } as unknown as AiPlatformAuditService;
    policies = {
      requireActive: vi.fn().mockResolvedValue({ id: 'policy-1', status: 'ACTIVE' }),
      requireAssignableForProduction: vi
        .fn()
        .mockResolvedValue({ id: 'policy-1', status: 'ACTIVE' }),
    } as unknown as AiModelPolicyService;
    prompts = {
      requireAssignablePublished: vi.fn().mockResolvedValue({
        promptPolicyId: 'prompt-1',
        promptVersionId: 'ver-1',
        version: 1,
        contentDigest: 'abc',
        status: 'PUBLISHED',
      }),
    } as unknown as AiPromptPolicyService;
    service = new InternalAgentService(prisma as never, audit, policies, prompts);
    prisma.employee.findUnique.mockResolvedValue({ id: OWNER_ID });
  });

  it('creates a DRAFT agent that is not a model identity', async () => {
    prisma.internalAiAgent.create.mockResolvedValue(agentRow());
    prisma.internalAiAgent.findUniqueOrThrow.mockResolvedValue(agentRow());
    const agent = await service.create(
      { name: '  Delivery Assistant  ', ownerId: OWNER_ID },
      ACTOR_ID,
    );
    expect(agent.status).toBe('DRAFT');
    expect(agent).not.toHaveProperty('provider');
    expect(agent).not.toHaveProperty('providerModelId');
    expect(audit.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: AI_AUDIT_ENTITY.internalAgent,
        action: AI_AUDIT_ACTION.internalAgentCreated,
      }),
      prisma,
    );
  });

  it('refuses activation without an active Model Policy', async () => {
    lockRow(prisma, agentRow());
    prisma.internalAiAgent.findUniqueOrThrow.mockResolvedValue(agentRow());
    await expect(service.activate('ia-1', ACTOR_ID)).rejects.toThrow(BadRequestException);
    expect(prisma.internalAiAgent.update).not.toHaveBeenCalled();
  });

  it('activates after Model Policy validation and does not touch grants', async () => {
    lockRow(prisma, agentRow({ modelPolicyId: 'policy-1' }));
    prisma.internalAiAgent.findUniqueOrThrow.mockResolvedValue(
      agentRow({ modelPolicyId: 'policy-1', status: 'ACTIVE' }),
    );
    const agent = await service.activate('ia-1', ACTOR_ID);
    expect(policies.requireAssignableForProduction).toHaveBeenCalledWith('policy-1', prisma);
    expect(agent.status).toBe('ACTIVE');
    expect(prisma.internalAiAgentCapabilityGrant.update).not.toHaveBeenCalled();
    expect(prisma.internalAiAgentCapabilityGrant.create).not.toHaveBeenCalled();
  });

  it('changing the model policy does not write capability grants', async () => {
    lockRow(prisma, agentRow({ status: 'ACTIVE', modelPolicyId: 'policy-1' }));
    prisma.internalAiAgent.findUniqueOrThrow.mockResolvedValue(
      agentRow({ status: 'ACTIVE', modelPolicyId: 'policy-2' }),
    );
    await service.update('ia-1', { modelPolicyId: 'policy-2' }, ACTOR_ID);
    expect(prisma.internalAiAgent.update).toHaveBeenCalledWith({
      where: { id: 'ia-1' },
      data: expect.objectContaining({ modelPolicyId: 'policy-2' }),
    });
    expect(prisma.internalAiAgentCapabilityGrant.updateMany).not.toHaveBeenCalled();
    expect(prisma.internalAiAgentResourceScope.updateMany).not.toHaveBeenCalled();
  });

  it('refuses to clear the Model Policy of an ACTIVE agent under the row lock', async () => {
    prisma.$queryRaw.mockImplementation(async () => {
      prisma.internalAiAgent.findUniqueOrThrow.mockResolvedValue(
        agentRow({ status: 'ACTIVE', modelPolicyId: 'policy-1' }),
      );
      return [{ id: 'ia-1' }];
    });
    await expect(service.update('ia-1', { modelPolicyId: null }, ACTOR_ID)).rejects.toThrow(
      /requires a Model Policy/,
    );
    expect(prisma.internalAiAgent.update).not.toHaveBeenCalled();
    expect(policies.requireAssignableForProduction).not.toHaveBeenCalled();
  });

  it('revalidates a replacement policy after the row lock', async () => {
    lockRow(prisma, agentRow({ status: 'ACTIVE', modelPolicyId: 'policy-1' }));
    prisma.internalAiAgent.findUniqueOrThrow.mockResolvedValue(
      agentRow({ status: 'ACTIVE', modelPolicyId: 'policy-2' }),
    );
    await service.update('ia-1', { modelPolicyId: 'policy-2' }, ACTOR_ID);
    expect(policies.requireAssignableForProduction).toHaveBeenCalledWith('policy-2', prisma);
    const lockOrder = prisma.$queryRaw.mock.invocationCallOrder[0];
    const validateOrder = vi.mocked(policies.requireAssignableForProduction).mock
      .invocationCallOrder[0];
    expect(lockOrder).toBeLessThan(validateOrder);
  });

  it('assigns only a published prompt policy and does not write grants', async () => {
    lockRow(prisma, agentRow());
    prisma.internalAiAgent.findUniqueOrThrow.mockResolvedValue(
      agentRow({ promptPolicyId: 'prompt-1' }),
    );
    await service.update('ia-1', { promptPolicyId: 'prompt-1' }, ACTOR_ID);
    expect(prompts.requireAssignablePublished).toHaveBeenCalledWith('prompt-1', prisma);
    expect(prisma.internalAiAgentCapabilityGrant.create).not.toHaveBeenCalled();
    expect(prisma.internalAiAgentResourceScope.create).not.toHaveBeenCalled();
  });

  it('refuses an unpublished prompt policy assignment', async () => {
    lockRow(prisma, agentRow());
    vi.mocked(prompts.requireAssignablePublished).mockRejectedValueOnce(
      new BadRequestException('Prompt policy has no PUBLISHED version'),
    );
    await expect(
      service.update('ia-1', { promptPolicyId: 'prompt-draft' }, ACTOR_ID),
    ).rejects.toThrow(/PUBLISHED/);
    expect(prisma.internalAiAgent.update).not.toHaveBeenCalled();
  });

  it('archives without deleting the identity used for attribution', async () => {
    lockRow(prisma, agentRow({ status: 'DISABLED' }));
    prisma.internalAiAgent.findUniqueOrThrow.mockResolvedValue(
      agentRow({ status: 'ARCHIVED', archivedAt: new Date() }),
    );
    const archived = await service.archive('ia-1', ACTOR_ID);
    expect(archived.status).toBe('ARCHIVED');
    expect(prisma.internalAiAgent.delete).not.toHaveBeenCalled();
    prisma.internalAiAgent.findMany.mockResolvedValue([{ id: 'ia-1', name: 'Delivery Assistant' }]);
    const names = await service.resolveDisplayNames(['ia-1']);
    expect(names.get('ia-1')).toBe('Delivery Assistant');
  });
});
