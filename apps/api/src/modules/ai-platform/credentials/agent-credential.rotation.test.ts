import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AGENT_CREDENTIAL_MAX_OVERLAP_MS } from '../ai-platform.constants';
import { AgentCredentialService } from './agent-credential.service';
import { parseAgentToken } from './agent-token';

const AGENT_ID = 'agent-1';
const ACTOR_ID = 'emp-admin';
const HOUR_MS = 60 * 60 * 1_000;

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

describe('AgentCredentialService rotation', () => {
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
    });
  });

  describe('rotate', () => {
    beforeEach(() => {
      prisma.externalAgentCredential.findUnique.mockResolvedValue({ agentId: AGENT_ID });
      prisma.externalAgentCredential.findUniqueOrThrow.mockResolvedValue(credentialRow());
      prisma.externalAgentCredential.create.mockImplementation(({ data }: { data: never }) =>
        Promise.resolve(credentialRow({ id: 'cred-2', ...(data as object) })),
      );
    });

    it('keeps the agent identity stable across rotation', async () => {
      const rotated = await service.rotate({ credentialId: 'cred-1' }, ACTOR_ID);

      expect(rotated.credential.agentId).toBe(AGENT_ID);
      expect(rotated.credential.id).not.toBe('cred-1');
      expect(prisma.externalAgentCredential.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ agentId: AGENT_ID, rotatedFromId: 'cred-1' }),
      });
    });

    it('issues a genuinely new secret under a new key id', async () => {
      const rotated = await service.rotate({ credentialId: 'cred-1' }, ACTOR_ID);
      const parsed = parseAgentToken(rotated.token);

      expect(rotated.token).not.toContain('key-1');
      expect(parsed!.keyId).not.toBe('key-1');
      expect(rotated.credential.tokenPrefix).not.toContain(parsed!.secret);
    });

    it('locks the agent row before the credential row', async () => {
      await service.rotate({ credentialId: 'cred-1' }, ACTOR_ID);

      const lockedTables = prisma.$queryRaw.mock.calls.map(([fragments]: [string[]]) =>
        fragments.join(' ').includes('external_agents') ? 'agent' : 'credential',
      );
      // Agent revoke locks agent then credentials; rotation must not invert it.
      expect(lockedTables).toEqual(['agent', 'credential']);
    });

    it('fails for a credential whose agent cannot be resolved', async () => {
      prisma.externalAgentCredential.findUnique.mockResolvedValue(null);

      await expect(service.rotate({ credentialId: 'ghost' }, ACTOR_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('revokes the predecessor immediately without an overlap window', async () => {
      await service.rotate({ credentialId: 'cred-1' }, ACTOR_ID);

      expect(prisma.externalAgentCredential.update).toHaveBeenCalledWith({
        where: { id: 'cred-1' },
        data: expect.objectContaining({ revokedById: ACTOR_ID }),
      });
    });

    it('honours a controlled overlap window instead of revoking', async () => {
      const overlapUntil = new Date(Date.now() + HOUR_MS);
      await service.rotate({ credentialId: 'cred-1', previousValidUntil: overlapUntil }, ACTOR_ID);

      expect(prisma.externalAgentCredential.update).toHaveBeenCalledWith({
        where: { id: 'cred-1' },
        data: { expiresAt: overlapUntil },
      });
    });

    describe('overlap window validation', () => {
      it('refuses a window in the past', async () => {
        await expect(
          service.rotate(
            { credentialId: 'cred-1', previousValidUntil: new Date(Date.now() - HOUR_MS) },
            ACTOR_ID,
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('refuses a window beyond the configured maximum', async () => {
        await expect(
          service.rotate(
            {
              credentialId: 'cred-1',
              previousValidUntil: new Date(Date.now() + AGENT_CREDENTIAL_MAX_OVERLAP_MS + HOUR_MS),
            },
            ACTOR_ID,
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('accepts a window exactly at the configured maximum', async () => {
        const boundary = new Date(Date.now() + AGENT_CREDENTIAL_MAX_OVERLAP_MS - 1_000);
        await expect(
          service.rotate({ credentialId: 'cred-1', previousValidUntil: boundary }, ACTOR_ID),
        ).resolves.toBeDefined();
      });

      it('never extends a predecessor that already had an earlier expiry', async () => {
        prisma.externalAgentCredential.findUniqueOrThrow.mockResolvedValue(
          credentialRow({ expiresAt: new Date(Date.now() + HOUR_MS) }),
        );

        await expect(
          service.rotate(
            { credentialId: 'cred-1', previousValidUntil: new Date(Date.now() + 2 * HOUR_MS) },
            ACTOR_ID,
          ),
        ).rejects.toThrow(BadRequestException);
      });
    });

    it('refuses to rotate the same predecessor twice with a deterministic conflict', async () => {
      prisma.externalAgentCredential.findFirst.mockResolvedValue({ id: 'cred-2' });

      await expect(service.rotate({ credentialId: 'cred-1' }, ACTOR_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.externalAgentCredential.create).not.toHaveBeenCalled();
    });

    it('refuses to rotate a revoked credential', async () => {
      prisma.externalAgentCredential.findUniqueOrThrow.mockResolvedValue(
        credentialRow({ revokedAt: new Date('2026-08-10T00:00:00.000Z') }),
      );
      await expect(service.rotate({ credentialId: 'cred-1' }, ACTOR_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('refuses to rotate into a revoked agent', async () => {
      prisma.externalAgent.findUniqueOrThrow.mockResolvedValue({
        status: 'REVOKED',
        revokedAt: new Date('2026-08-10T00:00:00.000Z'),
      });

      await expect(service.rotate({ credentialId: 'cred-1' }, ACTOR_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.externalAgentCredential.create).not.toHaveBeenCalled();
    });

    it('does not revoke the predecessor when the audit write fails', async () => {
      vi.mocked(audit.logAdminAction).mockRejectedValueOnce(new Error('audit unavailable'));

      await expect(service.rotate({ credentialId: 'cred-1' }, ACTOR_ID)).rejects.toThrow(
        'audit unavailable',
      );
      expect(audit.logAdminAction).toHaveBeenCalledWith(expect.anything(), prisma);
    });

    it('fails for an unknown credential', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      await expect(service.rotate({ credentialId: 'ghost' }, ACTOR_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
