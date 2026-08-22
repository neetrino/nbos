import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { ACTOR_ID, agentRow, lockRow, OWNER_ID } from './external-agent.fixtures';
import { ExternalAgentService } from './external-agent.service';

/**
 * Lifecycle transitions of an External Agent: disable, enable, expiry and the
 * terminality of revocation. Split from the main service suite so both files
 * stay inside the file budget.
 */
describe('ExternalAgentService lifecycle', () => {
  let prisma: MockPrisma;
  let audit: AiPlatformAuditService;
  let service: ExternalAgentService;

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = {
      logAdminAction: vi.fn(),
      logMachineAction: vi.fn(),
    } as unknown as AiPlatformAuditService;
    service = new ExternalAgentService(prisma as never, audit);
    prisma.employee.findUnique.mockResolvedValue({ id: OWNER_ID });
  });

  describe('disable and enable', () => {
    beforeEach(() => {
      lockRow(prisma, agentRow());
    });

    it('disables an agent and records disabledAt', async () => {
      prisma.externalAgent.update.mockResolvedValue(agentRow({ status: 'DISABLED' }));

      const agent = await service.disable('agent-1', ACTOR_ID);

      expect(prisma.externalAgent.update).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: expect.objectContaining({ status: 'DISABLED' }),
      });
      expect(agent.state).toBe('DISABLED');
    });

    it.each([
      ['stored EXPIRED', agentRow({ status: 'EXPIRED' })],
      [
        'DISABLED with elapsed expiry',
        agentRow({ status: 'DISABLED', expiresAt: new Date('2026-08-02T00:00:00.000Z') }),
      ],
    ])('refuses to enable an agent that is %s', async (_label, row) => {
      lockRow(prisma, row);

      await expect(service.enable('agent-1', ACTOR_ID)).rejects.toThrow(BadRequestException);
      expect(prisma.externalAgent.update).not.toHaveBeenCalled();
      expect(audit.logAdminAction).not.toHaveBeenCalled();
    });

    it('still disables an agent whose expiry has elapsed', async () => {
      lockRow(prisma, agentRow({ expiresAt: new Date('2026-08-02T00:00:00.000Z') }));
      prisma.externalAgent.update.mockResolvedValue(agentRow({ status: 'DISABLED' }));

      await service.disable('agent-1', ACTOR_ID);

      expect(prisma.externalAgent.update).toHaveBeenCalled();
    });

    it('enables an agent whose expiry is still in the future', async () => {
      lockRow(
        prisma,
        agentRow({ status: 'DISABLED', expiresAt: new Date('2099-01-01T00:00:00Z') }),
      );
      prisma.externalAgent.update.mockResolvedValue(
        agentRow({ status: 'ACTIVE', expiresAt: new Date('2099-01-01T00:00:00Z') }),
      );

      const agent = await service.enable('agent-1', ACTOR_ID);

      expect(agent.state).toBe('ACTIVE');
    });

    it('locks the agent row before it reads lifecycle state', async () => {
      prisma.externalAgent.update.mockResolvedValue(agentRow());

      await service.enable('agent-1', ACTOR_ID);

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      const lockedBeforeRead =
        prisma.$queryRaw.mock.invocationCallOrder[0] <
        prisma.externalAgent.findUniqueOrThrow.mock.invocationCallOrder[0];
      expect(lockedBeforeRead).toBe(true);
    });
  });

  describe('revocation is terminal', () => {
    beforeEach(() => {
      lockRow(prisma, agentRow({ status: 'REVOKED', revokedAt: new Date('2026-08-10T00:00:00Z') }));
    });

    it.each([
      ['disable', (target: ExternalAgentService) => target.disable('agent-1', ACTOR_ID)],
      ['enable', (target: ExternalAgentService) => target.enable('agent-1', ACTOR_ID)],
      [
        'update',
        (target: ExternalAgentService) => target.update('agent-1', { name: 'Renamed' }, ACTOR_ID),
      ],
    ])('refuses to %s a revoked agent', async (_label, act) => {
      await expect(act(service)).rejects.toThrow(BadRequestException);
      expect(prisma.externalAgent.update).not.toHaveBeenCalled();
      expect(audit.logAdminAction).not.toHaveBeenCalled();
    });

    it('refuses a transition for an agent revoked behind an ACTIVE status column', async () => {
      lockRow(prisma, agentRow({ status: 'ACTIVE', revokedAt: new Date('2026-08-10T00:00:00Z') }));

      await expect(service.enable('agent-1', ACTOR_ID)).rejects.toThrow(BadRequestException);
      expect(prisma.externalAgent.update).not.toHaveBeenCalled();
    });

    it('reports REVOKED even if the status column was walked back', async () => {
      prisma.externalAgent.findUnique.mockResolvedValue(
        agentRow({ status: 'ACTIVE', revokedAt: new Date('2026-08-10T00:00:00.000Z') }),
      );

      const agent = await service.findById('agent-1');

      expect(agent?.state).toBe('REVOKED');
    });
  });
});
