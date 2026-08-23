import { beforeEach, describe, expect, it } from 'vitest';
import { actorContextFromMachine } from '@nbos/shared';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiExecutionService } from './ai-execution.service';

function actor() {
  return actorContextFromMachine(
    { id: 'agent-1', type: 'EXTERNAL_AGENT', displayName: 'Agent' },
    {
      channel: { source: 'rest', protocol: null },
      correlationId: 'corr-1',
      client: { ipAddress: null, userAgent: null, credentialId: null },
    },
  );
}

describe('AiExecutionService', () => {
  let prisma: MockPrisma;
  let service: AiExecutionService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new AiExecutionService(prisma as never);
  });

  it('persists capability attribution without prompt bodies', async () => {
    prisma.aiExecution.create.mockResolvedValue({
      id: 'exec-1',
      kind: 'CAPABILITY',
      status: 'SUCCEEDED',
      actorType: 'EXTERNAL_AGENT',
      actorId: 'agent-1',
      onBehalfOfActorType: null,
      onBehalfOfActorId: null,
      externalAgentId: 'agent-1',
      internalAgentId: null,
      providerConnectionId: 'conn-1',
      modelId: 'model-1',
      modelPolicyId: 'policy-1',
      modelPolicyVersion: 2,
      promptPolicyId: null,
      promptVersionId: null,
      capabilityKey: 'tasks.read',
      domainModule: 'Tasks',
      channel: 'rest',
      correlationId: 'corr-1',
      retryCount: 1,
      fallbackOccurred: true,
      fallbackReason: 'TIMEOUT',
      selectedPrimaryModelId: 'model-1',
      selectedFallbackModelId: 'model-2',
      latencyMs: 12,
      errorCode: null,
      inputUnits: 10,
      outputUnits: 4,
      cachedUnits: null,
      reasoningUnits: null,
      otherUnits: null,
      providerReportedCost: { toString: () => '0.002' },
      estimatedCost: { toString: () => '0.003' },
      currency: 'USD',
      pricingVersion: 'openai-2026-08-01',
      pricingEffectiveOn: new Date('2026-08-01T00:00:00.000Z'),
      startedAt: new Date(),
      completedAt: new Date(),
    });

    const record = await service.record({
      kind: 'CAPABILITY',
      status: 'SUCCEEDED',
      actor: actor(),
      externalAgentId: 'agent-1',
      providerConnectionId: 'conn-1',
      modelId: 'model-1',
      modelPolicyId: 'policy-1',
      modelPolicyVersion: 2,
      capabilityKey: 'tasks.read',
      retryCount: 1,
      fallbackOccurred: true,
      fallbackReason: 'TIMEOUT',
      selectedPrimaryModelId: 'model-1',
      selectedFallbackModelId: 'model-2',
      latencyMs: 12,
      inputUnits: 10,
      outputUnits: 4,
      estimatedCost: '0.003',
      providerReportedCost: '0.002',
      currency: 'USD',
      pricingVersion: 'openai-2026-08-01',
      pricingEffectiveOn: new Date('2026-08-01T00:00:00.000Z'),
      startedAt: new Date(),
      completedAt: new Date(),
    });

    expect(record).toMatchObject({
      actor: { actorType: 'EXTERNAL_AGENT', actorId: 'agent-1' },
      capabilityKey: 'tasks.read',
      modelId: 'model-1',
      modelPolicyId: 'policy-1',
      correlationId: 'corr-1',
      fallbackOccurred: true,
      pricingVersion: 'openai-2026-08-01',
    });
    const persisted = prisma.aiExecution.create.mock.calls[0][0].data as Record<string, unknown>;
    expect(persisted).not.toHaveProperty('prompt');
    expect(persisted).not.toHaveProperty('completion');
    expect(persisted).not.toHaveProperty('apiKey');
    expect(JSON.stringify(persisted)).not.toMatch(/system:|sk-test/i);
  });

  it('drops a smuggled secret field instead of persisting it', async () => {
    prisma.aiExecution.create.mockResolvedValue({
      id: 'exec-2',
      kind: 'CAPABILITY',
      status: 'SUCCEEDED',
      actorType: 'EXTERNAL_AGENT',
      actorId: 'agent-1',
      onBehalfOfActorType: null,
      onBehalfOfActorId: null,
      externalAgentId: 'agent-1',
      internalAgentId: null,
      providerConnectionId: null,
      modelId: null,
      modelPolicyId: null,
      modelPolicyVersion: null,
      promptPolicyId: null,
      promptVersionId: null,
      capabilityKey: 'tasks.read',
      domainModule: 'Tasks',
      channel: 'rest',
      correlationId: 'corr-1',
      retryCount: 0,
      fallbackOccurred: false,
      fallbackReason: null,
      selectedPrimaryModelId: null,
      selectedFallbackModelId: null,
      latencyMs: null,
      errorCode: null,
      inputUnits: null,
      outputUnits: null,
      cachedUnits: null,
      reasoningUnits: null,
      otherUnits: null,
      providerReportedCost: null,
      estimatedCost: null,
      currency: null,
      pricingVersion: null,
      pricingEffectiveOn: null,
      startedAt: new Date(),
      completedAt: new Date(),
    });

    await service.record({
      kind: 'CAPABILITY',
      status: 'SUCCEEDED',
      actor: actor(),
      capabilityKey: 'tasks.read',
      secret: 'sk-live-should-never-land',
      startedAt: new Date(),
    } as never);

    expect(prisma.aiExecution.create).toHaveBeenCalled();
    expect(JSON.stringify(prisma.aiExecution.create.mock.calls[0][0].data)).not.toMatch(/sk-live/);
    expect(prisma.aiExecution.create.mock.calls[0][0].data).not.toHaveProperty('secret');
  });
});
