import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type AgentScopeTypeEnum } from '@nbos/database';
import { isAiCapabilityKey, type AiScopeType } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import {
  toAgentCapabilityGrantView,
  toAgentResourceScopeView,
  type AgentCapabilityGrantView,
  type AgentResourceScopeView,
} from '../agents/external-agent.mapper';
import {
  normalizeGrantReason,
  resolveScopeId,
  resolveScopeResourceType,
} from '../grants/agent-grant.rules';
import { lockLiveInternalAgent } from './internal-agent-row-lock';

const ARCHIVED_AGENT_HAS_NO_GRANTS = 'An archived Internal Agent cannot receive grants';

export interface GrantInternalCapabilityInput {
  agentId: string;
  capabilityKey: string;
  reason?: string | null;
  expiresAt?: Date | null;
}

export interface GrantInternalScopeInput {
  agentId: string;
  scopeType: AiScopeType;
  scopeId?: string | null;
  resourceType?: string | null;
  reason?: string | null;
  expiresAt?: Date | null;
}

/**
 * Same capability/scope architecture as External Agents, bound to InternalAiAgent.
 * Changing a Model Policy never writes these tables.
 */
@Injectable()
export class InternalAgentGrantService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AiPlatformAuditService,
  ) {}

  async grantCapability(
    input: GrantInternalCapabilityInput,
    actingEmployeeId: string,
  ): Promise<AgentCapabilityGrantView> {
    if (!isAiCapabilityKey(input.capabilityKey)) {
      throw new BadRequestException('Unknown capability');
    }
    const reason = normalizeGrantReason(input.reason);
    const expiresAt = input.expiresAt ?? null;
    const grant = await this.prisma.$transaction(async (tx) => {
      await lockLiveInternalAgent(tx, input.agentId, ARCHIVED_AGENT_HAS_NO_GRANTS);
      const upserted = await tx.internalAiAgentCapabilityGrant.upsert({
        where: {
          agentId_capabilityKey: { agentId: input.agentId, capabilityKey: input.capabilityKey },
        },
        create: {
          agentId: input.agentId,
          capabilityKey: input.capabilityKey,
          grantedById: actingEmployeeId,
          reason,
          expiresAt,
        },
        update: {
          grantedById: actingEmployeeId,
          reason,
          expiresAt,
          revokedAt: null,
          revokedById: null,
        },
      });
      await this.audit.logAdminAction(
        {
          entityType: AI_AUDIT_ENTITY.internalCapabilityGrant,
          entityId: upserted.id,
          action: AI_AUDIT_ACTION.capabilityGranted,
          actingEmployeeId,
          changes: { agentId: input.agentId, capabilityKey: input.capabilityKey },
        },
        tx,
      );
      return upserted;
    });
    return toAgentCapabilityGrantView(grant);
  }

  async revokeCapability(
    agentId: string,
    capabilityKey: string,
    actingEmployeeId: string,
  ): Promise<AgentCapabilityGrantView> {
    const grant = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.internalAiAgentCapabilityGrant.findUnique({
        where: { agentId_capabilityKey: { agentId, capabilityKey } },
      });
      if (!existing) {
        throw new NotFoundException('Capability grant not found');
      }
      if (existing.revokedAt !== null) {
        return existing;
      }
      const revoked = await tx.internalAiAgentCapabilityGrant.update({
        where: { id: existing.id },
        data: { revokedAt: new Date(), revokedById: actingEmployeeId },
      });
      await this.audit.logAdminAction(
        {
          entityType: AI_AUDIT_ENTITY.internalCapabilityGrant,
          entityId: revoked.id,
          action: AI_AUDIT_ACTION.capabilityRevoked,
          actingEmployeeId,
          changes: { agentId, capabilityKey },
        },
        tx,
      );
      return revoked;
    });
    return toAgentCapabilityGrantView(grant);
  }

  async grantScope(
    input: GrantInternalScopeInput,
    actingEmployeeId: string,
  ): Promise<AgentResourceScopeView> {
    const key = {
      agentId: input.agentId,
      scopeType: input.scopeType as AgentScopeTypeEnum,
      scopeId: resolveScopeId(input.scopeType, input.scopeId),
      resourceType: resolveScopeResourceType(input.scopeType, input.resourceType),
    };
    const reason = normalizeGrantReason(input.reason);
    const expiresAt = input.expiresAt ?? null;
    const scope = await this.prisma.$transaction(async (tx) => {
      await lockLiveInternalAgent(tx, input.agentId, ARCHIVED_AGENT_HAS_NO_GRANTS);
      const upserted = await tx.internalAiAgentResourceScope.upsert({
        where: { agentId_scopeType_scopeId_resourceType: key },
        create: { ...key, grantedById: actingEmployeeId, reason, expiresAt },
        update: {
          grantedById: actingEmployeeId,
          reason,
          expiresAt,
          revokedAt: null,
          revokedById: null,
        },
      });
      await this.audit.logAdminAction(
        {
          entityType: AI_AUDIT_ENTITY.internalResourceScope,
          entityId: upserted.id,
          action: AI_AUDIT_ACTION.scopeGranted,
          actingEmployeeId,
          changes: { agentId: input.agentId, scopeType: key.scopeType, scopeId: key.scopeId },
        },
        tx,
      );
      return upserted;
    });
    return toAgentResourceScopeView(scope);
  }

  async revokeScope(
    scopeRecordId: string,
    actingEmployeeId: string,
  ): Promise<AgentResourceScopeView> {
    const scope = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.internalAiAgentResourceScope.findUnique({
        where: { id: scopeRecordId },
      });
      if (!existing) {
        throw new NotFoundException('Resource scope not found');
      }
      if (existing.revokedAt !== null) {
        return existing;
      }
      const revoked = await tx.internalAiAgentResourceScope.update({
        where: { id: existing.id },
        data: { revokedAt: new Date(), revokedById: actingEmployeeId },
      });
      await this.audit.logAdminAction(
        {
          entityType: AI_AUDIT_ENTITY.internalResourceScope,
          entityId: revoked.id,
          action: AI_AUDIT_ACTION.scopeRevoked,
          actingEmployeeId,
          changes: {
            agentId: existing.agentId,
            scopeType: existing.scopeType,
            scopeId: existing.scopeId,
          },
        },
        tx,
      );
      return revoked;
    });
    return toAgentResourceScopeView(scope);
  }

  async requireScopeOnAgent(agentId: string, scopeId: string): Promise<AgentResourceScopeView> {
    const scope = await this.prisma.internalAiAgentResourceScope.findUnique({
      where: { id: scopeId },
    });
    if (!scope || scope.agentId !== agentId) {
      throw new NotFoundException('Resource scope not found');
    }
    return toAgentResourceScopeView(scope);
  }

  async listCapabilities(agentId: string): Promise<AgentCapabilityGrantView[]> {
    const grants = await this.prisma.internalAiAgentCapabilityGrant.findMany({
      where: { agentId },
      orderBy: { capabilityKey: 'asc' },
    });
    return grants.map((grant) => toAgentCapabilityGrantView(grant));
  }

  async listScopes(agentId: string): Promise<AgentResourceScopeView[]> {
    const scopes = await this.prisma.internalAiAgentResourceScope.findMany({
      where: { agentId },
      orderBy: { createdAt: 'asc' },
    });
    return scopes.map((scope) => toAgentResourceScopeView(scope));
  }
}
