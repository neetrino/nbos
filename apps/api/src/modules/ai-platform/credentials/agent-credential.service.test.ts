import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION } from '../ai-platform.constants';
import { AgentCredentialService } from './agent-credential.service';
import { verifyAgentSecret } from './agent-secret-hash';
import { parseAgentToken } from './agent-token';

const AGENT_ID = 'agent-1';
const ACTOR_ID = 'emp-admin';

function credentialRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cred-1',
    agentId: AGENT_ID,
    keyId: 'key-1',
    tokenPrefix: 'nbos_agt_key-1_abcd',
    secretHash: '$argon2id$stored',
    label: 'Laptop',
    createdById: ACTOR_ID,
    rotatedFromId: null,
    expiresAt: null,
    revokedAt: null,
    revokedById: null,
    lastUsedAt: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('AgentCredentialService', () => {
  let prisma: MockPrisma;
  let audit: AiPlatformAuditService;
  let service: AgentCredentialService;

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = {
      logAdminAction: vi.fn(),
      logMachineAction: vi.fn(),
    } as unknown as AiPlatformAuditService;
    service = new AgentCredentialService(prisma as never, audit);
    // Row locks resolve; state is asserted from the model reads below.
    prisma.$queryRaw.mockResolvedValue([{ id: 'locked' }]);
    prisma.externalAgent.findUniqueOrThrow.mockResolvedValue({
      status: 'ACTIVE',
      revokedAt: null,
      expiresAt: null,
    });
  });

  describe('issue', () => {
    beforeEach(() => {
      prisma.externalAgentCredential.create.mockImplementation(({ data }: { data: never }) =>
        Promise.resolve(credentialRow(data)),
      );
    });

    it('returns the raw token once and stores only a verifier', async () => {
      const issued = await service.issue({ agentId: AGENT_ID, label: 'Laptop' }, ACTOR_ID);
      const parsed = parseAgentToken(issued.token);
      const persisted = prisma.externalAgentCredential.create.mock.calls[0]![0].data;

      expect(parsed).not.toBeNull();
      expect(persisted.secretHash).not.toContain(parsed!.secret);
      expect(await verifyAgentSecret(persisted.secretHash, parsed!.secret)).toBe(true);
      expect(persisted.keyId).toBe(parsed!.keyId);
    });

    it('never exposes the hash in the returned projection', async () => {
      const issued = await service.issue({ agentId: AGENT_ID }, ACTOR_ID);

      expect(Object.keys(issued.credential)).not.toContain('secretHash');
      expect(JSON.stringify(issued.credential)).not.toContain('argon2');
    });

    it('never writes the raw token into audit', async () => {
      const issued = await service.issue({ agentId: AGENT_ID }, ACTOR_ID);
      const auditCall = vi.mocked(audit.logAdminAction).mock.calls[0]![0];

      expect(JSON.stringify(auditCall)).not.toContain(issued.token);
      expect(auditCall.action).toBe(AI_AUDIT_ACTION.credentialIssued);
    });

    it('writes the credential and its audit row in the same transaction', async () => {
      await service.issue({ agentId: AGENT_ID }, ACTOR_ID);

      expect(audit.logAdminAction).toHaveBeenCalledWith(expect.anything(), prisma);
    });

    it('does not hand out a token when the audit write fails', async () => {
      vi.mocked(audit.logAdminAction).mockRejectedValueOnce(new Error('audit unavailable'));

      await expect(service.issue({ agentId: AGENT_ID }, ACTOR_ID)).rejects.toThrow(
        'audit unavailable',
      );
    });

    it('rejects when successor expiry elapses after the preliminary check', async () => {
      const expiresAt = new Date(Date.now() + 60_000);
      prisma.$transaction.mockImplementation(async (fn: (tx: MockPrisma) => Promise<unknown>) => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(expiresAt.getTime() + 1));
        try {
          return await fn(prisma);
        } finally {
          vi.useRealTimers();
        }
      });

      await expect(service.issue({ agentId: AGENT_ID, expiresAt }, ACTOR_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.externalAgentCredential.create).not.toHaveBeenCalled();
    });

    it('refuses a past successor expiry before the transaction starts', async () => {
      await expect(
        service.issue(
          { agentId: AGENT_ID, expiresAt: new Date('2020-01-01T00:00:00.000Z') },
          ACTOR_ID,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('refuses to issue for a DISABLED agent whose expiry has elapsed', async () => {
      prisma.externalAgent.findUniqueOrThrow.mockResolvedValue({
        status: 'DISABLED',
        revokedAt: null,
        expiresAt: new Date('2020-01-01T00:00:00.000Z'),
      });

      await expect(service.issue({ agentId: AGENT_ID }, ACTOR_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.externalAgentCredential.create).not.toHaveBeenCalled();
    });

    it('refuses to issue for an expired agent', async () => {
      prisma.externalAgent.findUniqueOrThrow.mockResolvedValue({
        status: 'ACTIVE',
        revokedAt: null,
        expiresAt: new Date('2020-01-01T00:00:00.000Z'),
      });

      await expect(service.issue({ agentId: AGENT_ID }, ACTOR_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.externalAgentCredential.create).not.toHaveBeenCalled();
    });

    it('refuses to issue for a revoked agent', async () => {
      prisma.externalAgent.findUniqueOrThrow.mockResolvedValue({
        status: 'REVOKED',
        revokedAt: new Date('2026-08-10T00:00:00.000Z'),
        expiresAt: null,
      });

      await expect(service.issue({ agentId: AGENT_ID }, ACTOR_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.externalAgentCredential.create).not.toHaveBeenCalled();
    });

    it('refuses to issue for an agent revoked behind an ACTIVE status column', async () => {
      prisma.externalAgent.findUniqueOrThrow.mockResolvedValue({
        status: 'ACTIVE',
        revokedAt: new Date('2026-08-10T00:00:00.000Z'),
        expiresAt: null,
      });

      await expect(service.issue({ agentId: AGENT_ID }, ACTOR_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('fails for an unknown agent', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      await expect(service.issue({ agentId: 'ghost' }, ACTOR_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('revoke', () => {
    it('marks the credential revoked and audits once', async () => {
      prisma.externalAgentCredential.findUniqueOrThrow.mockResolvedValue(credentialRow());
      prisma.externalAgentCredential.update.mockResolvedValue(
        credentialRow({ revokedAt: new Date('2026-08-21T00:00:00.000Z') }),
      );

      const revoked = await service.revoke('cred-1', ACTOR_ID);

      expect(revoked.state).toBe('REVOKED');
      expect(audit.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: AI_AUDIT_ACTION.credentialRevoked }),
        prisma,
      );
    });

    it('is idempotent and does not re-audit an already revoked credential', async () => {
      prisma.externalAgentCredential.findUniqueOrThrow.mockResolvedValue(
        credentialRow({ revokedAt: new Date('2026-08-10T00:00:00.000Z') }),
      );

      await service.revoke('cred-1', ACTOR_ID);

      expect(prisma.externalAgentCredential.update).not.toHaveBeenCalled();
      expect(audit.logAdminAction).not.toHaveBeenCalled();
    });

    it('fails for an unknown credential', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      await expect(service.revoke('ghost', ACTOR_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
