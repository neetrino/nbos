import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AiModelPolicyResolver } from './ai-model-policy.resolver';
import { AiModelPolicyService } from './ai-model-policy.service';

function snapshotRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'policy-1',
    name: 'Support',
    purpose: null,
    mode: 'PRIMARY_FALLBACK',
    status: 'ACTIVE',
    version: 4,
    createdById: 'emp-admin',
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    candidates: [
      {
        modelId: 'm-1',
        role: 'PRIMARY',
        priority: 0,
        enabled: true,
        model: {
          providerModelId: 'gpt-4o',
          status: 'ACTIVE',
          connection: { id: 'conn-1', status: 'ACTIVE' },
        },
      },
      {
        modelId: 'm-2',
        role: 'FALLBACK',
        priority: 1,
        enabled: true,
        model: {
          providerModelId: 'claude',
          status: 'UNAVAILABLE',
          connection: { id: 'conn-2', status: 'ACTIVE' },
        },
      },
    ],
    ...overrides,
  };
}

describe('AiModelPolicyResolver', () => {
  let prisma: MockPrisma;
  let policies: AiModelPolicyService;
  let resolver: AiModelPolicyResolver;
  let requireActive: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    prisma = createMockPrisma();
    policies = new AiModelPolicyService(
      prisma as never,
      {
        logAdminAction: vi.fn(),
        logMachineAction: vi.fn(),
      } as unknown as AiPlatformAuditService,
    );
    requireActive = vi.spyOn(policies, 'requireActive');
    resolver = new AiModelPolicyResolver(policies);
  });

  it('skips an unavailable fallback and returns the healthy primary', async () => {
    prisma.aiModelPolicy.findUnique.mockResolvedValue(snapshotRow());
    const route = await resolver.resolveRoute('policy-1', 'op-123');
    expect(requireActive).not.toHaveBeenCalled();
    expect(route.operationKey).toBe('op-123');
    expect(route.policyVersion).toBe(4);
    expect(route.candidates.map((item) => item.modelId)).toEqual(['m-1']);
    expect(route.fallbackReasons).toContain('RATE_LIMIT');
  });

  it('skips a DISCOVERED fallback without failing the route', async () => {
    prisma.aiModelPolicy.findUnique.mockResolvedValue(
      snapshotRow({
        candidates: [
          snapshotRow().candidates[0],
          {
            modelId: 'm-2',
            role: 'FALLBACK',
            priority: 1,
            enabled: true,
            model: {
              providerModelId: 'claude',
              status: 'DISCOVERED',
              connection: { id: 'conn-2', status: 'ACTIVE' },
            },
          },
        ],
      }),
    );
    const route = await resolver.resolveRoute('policy-1');
    expect(route.candidates.map((item) => item.role)).toEqual(['PRIMARY']);
  });
});
