import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION } from '../ai-platform.constants';
import { InternalAgentGrantService } from './internal-agent-grant.service';

function lockLive(prisma: MockPrisma) {
  prisma.$queryRaw.mockResolvedValue([{ id: 'ia-1' }]);
  prisma.internalAiAgent.findUniqueOrThrow.mockResolvedValue({
    id: 'ia-1',
    status: 'DRAFT',
    archivedAt: null,
  });
}

describe('InternalAgentGrantService', () => {
  let prisma: MockPrisma;
  let audit: AiPlatformAuditService;
  let service: InternalAgentGrantService;

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = {
      logAdminAction: vi.fn(),
      logMachineAction: vi.fn(),
    } as unknown as AiPlatformAuditService;
    service = new InternalAgentGrantService(prisma as never, audit);
  });

  it('grants a registry capability onto the Internal Agent, not a model', async () => {
    lockLive(prisma);
    prisma.internalAiAgentCapabilityGrant.upsert.mockResolvedValue({
      id: 'g-1',
      agentId: 'ia-1',
      capabilityKey: 'tasks.read',
      reason: null,
      expiresAt: null,
      revokedAt: null,
      createdAt: new Date(),
    });
    const grant = await service.grantCapability(
      { agentId: 'ia-1', capabilityKey: 'tasks.read' },
      'emp-admin',
    );
    expect(grant.capabilityKey).toBe('tasks.read');
    expect(grant.agentId).toBe('ia-1');
  });

  it('grants, lists, revokes and re-grants a workspace scope', async () => {
    lockLive(prisma);
    const scopeRow = {
      id: 'scope-1',
      agentId: 'ia-1',
      scopeType: 'WORKSPACE',
      scopeId: 'ws-1',
      resourceType: '',
      reason: null,
      expiresAt: null,
      revokedAt: null,
      revokedById: null,
      createdAt: new Date(),
    };
    prisma.internalAiAgentResourceScope.upsert.mockResolvedValue(scopeRow);
    prisma.internalAiAgentResourceScope.findMany.mockResolvedValue([scopeRow]);
    const granted = await service.grantScope(
      { agentId: 'ia-1', scopeType: 'WORKSPACE', scopeId: 'ws-1' },
      'emp-admin',
    );
    expect(granted.scopeType).toBe('WORKSPACE');
    const listed = await service.listScopes('ia-1');
    expect(listed).toHaveLength(1);
    prisma.internalAiAgentResourceScope.findUnique.mockResolvedValue(scopeRow);
    prisma.internalAiAgentResourceScope.update.mockResolvedValue({
      ...scopeRow,
      revokedAt: new Date(),
      revokedById: 'emp-admin',
    });
    const revoked = await service.revokeScope('scope-1', 'emp-admin');
    expect(revoked.revokedAt).not.toBeNull();
    expect(audit.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: AI_AUDIT_ACTION.scopeRevoked }),
      prisma,
    );
    prisma.internalAiAgentResourceScope.upsert.mockResolvedValue({ ...scopeRow, revokedAt: null });
    const regranted = await service.grantScope(
      { agentId: 'ia-1', scopeType: 'WORKSPACE', scopeId: 'ws-1' },
      'emp-admin',
    );
    expect(regranted.revokedAt).toBeNull();
  });

  it('rejects unknown capabilities and archived agents', async () => {
    await expect(
      service.grantCapability({ agentId: 'ia-1', capabilityKey: 'credentials.read' }, 'emp-admin'),
    ).rejects.toThrow(BadRequestException);
    prisma.$queryRaw.mockResolvedValue([{ id: 'ia-1' }]);
    prisma.internalAiAgent.findUniqueOrThrow.mockResolvedValue({
      id: 'ia-1',
      status: 'ARCHIVED',
      archivedAt: new Date(),
    });
    await expect(
      service.grantCapability({ agentId: 'ia-1', capabilityKey: 'tasks.read' }, 'emp-admin'),
    ).rejects.toThrow(/archived/i);
  });
});
