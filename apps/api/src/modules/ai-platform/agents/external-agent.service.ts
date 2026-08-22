import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaClient, type ExternalAgentStatusEnum, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import { assertAgentNotExpired, EXPIRED_AGENT_CANNOT_BE_ENABLED } from './agent-issuable';
import {
  isAgentRevoked,
  lockAgentRow,
  lockLiveAgent,
  type PrismaTransaction,
} from './agent-row-lock';
import { toExternalAgentView, type ExternalAgentView } from './external-agent.mapper';
import { normalizeAgentDescription, requireAgentName } from './external-agent.rules';

const REVOKED_AGENT_IS_IMMUTABLE = 'A revoked agent cannot change state';

export interface CreateExternalAgentInput {
  name: string;
  description?: string | null;
  ownerId: string;
  expiresAt?: Date | null;
}

export interface UpdateExternalAgentInput {
  name?: string;
  description?: string | null;
  expiresAt?: Date | null;
}

/**
 * External Agent lifecycle. Agent identity is created once and stays stable for
 * the life of the agent: credentials rotate underneath it and never change the
 * actor id used by policy or audit.
 *
 * Every mutation runs in one transaction with its audit row, and every
 * transition takes the agent row lock before it reads state, so a lifecycle
 * change can neither escape the audit trail nor race a concurrent revoke.
 */
@Injectable()
export class ExternalAgentService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AiPlatformAuditService,
  ) {}

  async create(
    input: CreateExternalAgentInput,
    actingEmployeeId: string,
  ): Promise<ExternalAgentView> {
    const name = requireAgentName(input.name);
    const description = normalizeAgentDescription(input.description);
    await this.assertEmployeeExists(input.ownerId);

    const agent = await this.prisma.$transaction(async (tx) => {
      const created = await tx.externalAgent.create({
        data: {
          name,
          description: description ?? null,
          ownerId: input.ownerId,
          createdById: actingEmployeeId,
          expiresAt: input.expiresAt ?? null,
        },
      });
      await this.logLifecycle(tx, created.id, AI_AUDIT_ACTION.agentCreated, actingEmployeeId, {
        name,
        ownerId: input.ownerId,
        expiresAt: input.expiresAt?.toISOString() ?? null,
      });
      return created;
    });

    return toExternalAgentView(agent, new Date());
  }

  async update(
    agentId: string,
    input: UpdateExternalAgentInput,
    actingEmployeeId: string,
  ): Promise<ExternalAgentView> {
    const name = input.name === undefined ? undefined : requireAgentName(input.name);
    const description = normalizeAgentDescription(input.description);

    const agent = await this.prisma.$transaction(async (tx) => {
      const locked = await lockLiveAgent(tx, agentId, REVOKED_AGENT_IS_IMMUTABLE);
      const restoreExpired =
        input.expiresAt instanceof Date &&
        input.expiresAt.getTime() > Date.now() &&
        locked.status === 'EXPIRED';
      const updated = await tx.externalAgent.update({
        where: { id: agentId },
        data: {
          ...(name === undefined ? {} : { name }),
          ...(description === undefined ? {} : { description }),
          ...(input.expiresAt === undefined ? {} : { expiresAt: input.expiresAt }),
          ...(restoreExpired ? { status: 'ACTIVE' } : {}),
        },
      });
      await this.logLifecycle(tx, agentId, AI_AUDIT_ACTION.agentUpdated, actingEmployeeId, {
        nameChanged: name !== undefined,
        descriptionChanged: description !== undefined,
        expiresAtChanged: input.expiresAt !== undefined,
      });
      return updated;
    });

    return toExternalAgentView(agent, new Date());
  }

  /**
   * Disable blocks authentication immediately. Credential rows are preserved so
   * that re-enabling is an explicit, auditable decision; the auth path rejects
   * on agent state regardless of credential validity.
   */
  async disable(agentId: string, actingEmployeeId: string): Promise<ExternalAgentView> {
    return this.transition(agentId, 'DISABLED', AI_AUDIT_ACTION.agentDisabled, actingEmployeeId);
  }

  /**
   * Enable only restores an agent whose expiry is still in the future. Writing
   * `ACTIVE` onto an elapsed expiry would leave a row that is displayed as
   * `EXPIRED` today but silently becomes authorized the moment expiry is
   * extended, without a second enable decision.
   */
  async enable(agentId: string, actingEmployeeId: string): Promise<ExternalAgentView> {
    return this.transition(agentId, 'ACTIVE', AI_AUDIT_ACTION.agentEnabled, actingEmployeeId, {
      rejectExpired: true,
    });
  }

  /** Terminal state. Revokes every credential in the same transaction. */
  async revoke(agentId: string, actingEmployeeId: string): Promise<ExternalAgentView> {
    const now = new Date();
    const agent = await this.prisma.$transaction(async (tx) => {
      const locked = await lockAgentRow(tx, agentId);
      if (isAgentRevoked(locked)) {
        return tx.externalAgent.findUniqueOrThrow({ where: { id: agentId } });
      }

      await tx.externalAgentCredential.updateMany({
        where: { agentId, revokedAt: null },
        data: { revokedAt: now, revokedById: actingEmployeeId },
      });
      const revoked = await tx.externalAgent.update({
        where: { id: agentId },
        data: { status: 'REVOKED', revokedAt: now },
      });
      await this.logLifecycle(tx, agentId, AI_AUDIT_ACTION.agentRevoked, actingEmployeeId, {
        revokedAt: now.toISOString(),
      });
      return revoked;
    });

    return toExternalAgentView(agent, now);
  }

  async findById(agentId: string): Promise<ExternalAgentView | null> {
    const agent = await this.prisma.externalAgent.findUnique({ where: { id: agentId } });
    return agent ? toExternalAgentView(agent, new Date()) : null;
  }

  async listAll(): Promise<ExternalAgentView[]> {
    const now = new Date();
    const agents = await this.prisma.externalAgent.findMany({ orderBy: { createdAt: 'desc' } });
    return agents.map((agent) => toExternalAgentView(agent, now));
  }

  /** Batch display-name lookup for actor-aware Audit rendering. */
  async resolveDisplayNames(agentIds: string[]): Promise<Map<string, string>> {
    if (agentIds.length === 0) {
      return new Map();
    }
    const agents = await this.prisma.externalAgent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, name: true },
    });
    return new Map(agents.map((agent) => [agent.id, agent.name]));
  }

  private async transition(
    agentId: string,
    status: ExternalAgentStatusEnum,
    action: string,
    actingEmployeeId: string,
    options: { rejectExpired?: boolean } = {},
  ): Promise<ExternalAgentView> {
    const now = new Date();
    const agent = await this.prisma.$transaction(async (tx) => {
      const locked = await lockLiveAgent(tx, agentId, REVOKED_AGENT_IS_IMMUTABLE);
      if (options.rejectExpired) {
        assertAgentNotExpired(locked, EXPIRED_AGENT_CANNOT_BE_ENABLED);
      }
      const updated = await tx.externalAgent.update({
        where: { id: agentId },
        data: { status, disabledAt: status === 'DISABLED' ? now : null },
      });
      await this.logLifecycle(tx, agentId, action, actingEmployeeId, { status });
      return updated;
    });

    return toExternalAgentView(agent, now);
  }

  private async assertEmployeeExists(employeeId: string): Promise<void> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });
    if (!employee) {
      throw new BadRequestException('Owner employee not found');
    }
  }

  private async logLifecycle(
    tx: PrismaTransaction,
    agentId: string,
    action: string,
    actingEmployeeId: string,
    changes: InputJsonValue,
  ): Promise<void> {
    await this.audit.logAdminAction(
      {
        entityType: AI_AUDIT_ENTITY.agent,
        entityId: agentId,
        action,
        actingEmployeeId,
        changes,
      },
      tx,
    );
  }
}
