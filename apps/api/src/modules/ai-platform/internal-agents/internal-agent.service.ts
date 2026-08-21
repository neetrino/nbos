import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue, type InternalAiAgentStatusEnum } from '@nbos/database';
import { isInternalAiAgentSurface, type InternalAiAgentSurface } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import type { PrismaTransaction } from '../agents/agent-row-lock';
import { normalizeAgentDescription, requireAgentName } from '../agents/external-agent.rules';
import { AiModelPolicyService } from '../policies/ai-model-policy.service';
import {
  assertActiveAgentKeepsPolicy,
  nextInternalAgentPolicyId,
} from './internal-agent-policy.rules';
import {
  isInternalAgentArchived,
  lockInternalAgentRow,
  lockLiveInternalAgent,
} from './internal-agent-row-lock';
import { toInternalAgentView, type InternalAiAgentView } from './internal-agent.mapper';

const ARCHIVED_AGENT_IS_IMMUTABLE = 'An archived Internal Agent cannot change state';

export interface CreateInternalAgentInput {
  name: string;
  description?: string | null;
  ownerId: string;
  environment?: string | null;
}

export interface UpdateInternalAgentInput {
  name?: string;
  description?: string | null;
  ownerId?: string;
  environment?: string | null;
  modelPolicyId?: string | null;
  promptPolicyId?: string | null;
  approvalPolicyId?: string | null;
}

@Injectable()
export class InternalAgentService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AiPlatformAuditService,
    private readonly policies: AiModelPolicyService,
  ) {}

  async create(
    input: CreateInternalAgentInput,
    actingEmployeeId: string,
  ): Promise<InternalAiAgentView> {
    const name = requireAgentName(input.name);
    await this.assertEmployeeExists(input.ownerId);
    const created = await this.prisma.$transaction(async (tx) => {
      const agent = await tx.internalAiAgent.create({
        data: {
          name,
          description: normalizeAgentDescription(input.description) ?? null,
          ownerId: input.ownerId,
          createdById: actingEmployeeId,
          environment: normalizeAgentDescription(input.environment) ?? null,
        },
      });
      await this.log(tx, agent.id, AI_AUDIT_ACTION.internalAgentCreated, actingEmployeeId, {
        name,
        ownerId: input.ownerId,
      });
      return this.load(tx, agent.id);
    });
    return created;
  }

  async update(
    agentId: string,
    input: UpdateInternalAgentInput,
    actingEmployeeId: string,
  ): Promise<InternalAiAgentView> {
    if (input.ownerId) {
      await this.assertEmployeeExists(input.ownerId);
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const locked = await lockLiveInternalAgent(tx, agentId, ARCHIVED_AGENT_IS_IMMUTABLE);
      const nextPolicyId = nextInternalAgentPolicyId(locked.modelPolicyId, input.modelPolicyId);
      assertActiveAgentKeepsPolicy(locked.status, nextPolicyId);
      if (input.modelPolicyId) {
        await this.policies.requireAssignableForProduction(input.modelPolicyId, tx);
      }
      await tx.internalAiAgent.update({
        where: { id: agentId },
        data: toInternalAgentUpdateData(input),
      });
      await this.log(tx, agentId, AI_AUDIT_ACTION.internalAgentUpdated, actingEmployeeId, {
        modelPolicyChanged: input.modelPolicyId !== undefined,
        promptPolicyChanged: input.promptPolicyId !== undefined,
        approvalPolicyChanged: input.approvalPolicyId !== undefined,
      });
      return this.load(tx, agentId);
    });
    return updated;
  }

  async assignSurface(
    agentId: string,
    surface: string,
    enabled: boolean,
    actingEmployeeId: string,
  ): Promise<InternalAiAgentView> {
    if (!isInternalAiAgentSurface(surface)) {
      throw new BadRequestException('Unknown Internal Agent surface');
    }
    await this.prisma.$transaction(async (tx) => {
      await lockLiveInternalAgent(tx, agentId, ARCHIVED_AGENT_IS_IMMUTABLE);
      await tx.internalAiAgentSurfaceAssignment.upsert({
        where: { agentId_surface: { agentId, surface } },
        create: { agentId, surface, enabled },
        update: { enabled },
      });
      await this.log(tx, agentId, AI_AUDIT_ACTION.internalAgentUpdated, actingEmployeeId, {
        surface,
        enabled,
      });
    });
    return this.requireById(agentId);
  }

  async activate(agentId: string, actingEmployeeId: string): Promise<InternalAiAgentView> {
    return this.prisma.$transaction(async (tx) => {
      await lockLiveInternalAgent(tx, agentId, ARCHIVED_AGENT_IS_IMMUTABLE);
      const agent = await tx.internalAiAgent.findUniqueOrThrow({ where: { id: agentId } });
      if (!agent.modelPolicyId) {
        throw new BadRequestException(
          'Internal Agent requires an active Model Policy before activation',
        );
      }
      await this.policies.requireAssignableForProduction(agent.modelPolicyId, tx);
      await tx.internalAiAgent.update({
        where: { id: agentId },
        data: { status: 'ACTIVE', activatedAt: new Date(), pausedAt: null, disabledAt: null },
      });
      await this.log(tx, agentId, AI_AUDIT_ACTION.internalAgentActivated, actingEmployeeId, {
        modelPolicyId: agent.modelPolicyId,
      });
      return this.load(tx, agentId);
    });
  }

  async pause(agentId: string, actingEmployeeId: string): Promise<InternalAiAgentView> {
    return this.setStatus(agentId, 'PAUSED', AI_AUDIT_ACTION.internalAgentPaused, actingEmployeeId);
  }

  async disable(agentId: string, actingEmployeeId: string): Promise<InternalAiAgentView> {
    return this.setStatus(
      agentId,
      'DISABLED',
      AI_AUDIT_ACTION.internalAgentDisabled,
      actingEmployeeId,
    );
  }

  async archive(agentId: string, actingEmployeeId: string): Promise<InternalAiAgentView> {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const locked = await lockInternalAgentRow(tx, agentId);
      if (isInternalAgentArchived(locked)) {
        return this.load(tx, agentId);
      }
      await tx.internalAiAgent.update({
        where: { id: agentId },
        data: { status: 'ARCHIVED', archivedAt: now },
      });
      await this.log(tx, agentId, AI_AUDIT_ACTION.internalAgentArchived, actingEmployeeId, {
        archivedAt: now.toISOString(),
      });
      return this.load(tx, agentId);
    });
  }

  async findById(agentId: string): Promise<InternalAiAgentView | null> {
    const agent = await this.prisma.internalAiAgent.findUnique({
      where: { id: agentId },
      include: { surfaces: true },
    });
    return agent ? toInternalAgentView(agent, toSurfaceViews(agent.surfaces)) : null;
  }

  async requireById(agentId: string): Promise<InternalAiAgentView> {
    const agent = await this.findById(agentId);
    if (!agent) {
      throw new NotFoundException('Internal agent not found');
    }
    return agent;
  }

  async resolveDisplayNames(agentIds: string[]): Promise<Map<string, string>> {
    if (agentIds.length === 0) {
      return new Map();
    }
    const agents = await this.prisma.internalAiAgent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, name: true },
    });
    return new Map(agents.map((agent) => [agent.id, agent.name]));
  }

  private async setStatus(
    agentId: string,
    status: Extract<InternalAiAgentStatusEnum, 'PAUSED' | 'DISABLED'>,
    action: string,
    actingEmployeeId: string,
  ): Promise<InternalAiAgentView> {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      await lockLiveInternalAgent(tx, agentId, ARCHIVED_AGENT_IS_IMMUTABLE);
      await tx.internalAiAgent.update({
        where: { id: agentId },
        data: {
          status,
          pausedAt: status === 'PAUSED' ? now : null,
          disabledAt: status === 'DISABLED' ? now : null,
        },
      });
      await this.log(tx, agentId, action, actingEmployeeId, { status });
      return this.load(tx, agentId);
    });
  }

  private async load(tx: PrismaTransaction, agentId: string): Promise<InternalAiAgentView> {
    const agent = await tx.internalAiAgent.findUniqueOrThrow({
      where: { id: agentId },
      include: { surfaces: true },
    });
    return toInternalAgentView(agent, toSurfaceViews(agent.surfaces));
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

  private async log(
    tx: PrismaTransaction,
    entityId: string,
    action: string,
    actingEmployeeId: string,
    changes: InputJsonValue,
  ): Promise<void> {
    await this.audit.logAdminAction(
      {
        entityType: AI_AUDIT_ENTITY.internalAgent,
        entityId,
        action,
        actingEmployeeId,
        changes,
      },
      tx,
    );
  }
}

function toInternalAgentUpdateData(input: UpdateInternalAgentInput) {
  return {
    ...(input.name === undefined ? {} : { name: requireAgentName(input.name) }),
    ...(input.description === undefined
      ? {}
      : { description: normalizeAgentDescription(input.description) }),
    ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
    ...(input.environment === undefined
      ? {}
      : { environment: normalizeAgentDescription(input.environment) }),
    ...(input.modelPolicyId === undefined ? {} : { modelPolicyId: input.modelPolicyId }),
    ...(input.promptPolicyId === undefined ? {} : { promptPolicyId: input.promptPolicyId }),
    ...(input.approvalPolicyId === undefined ? {} : { approvalPolicyId: input.approvalPolicyId }),
  };
}

function toSurfaceViews(
  surfaces: Array<{ surface: InternalAiAgentSurface; enabled: boolean }>,
): Array<{ surface: InternalAiAgentSurface; enabled: boolean }> {
  return surfaces.map((item) => ({ surface: item.surface, enabled: item.enabled }));
}
