import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type AgentScopeTypeEnum } from '@nbos/database';
import { isAiCapabilityKey, type AiScopeType } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import { lockLiveAgent, type PrismaTransaction } from '../agents/agent-row-lock';
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
} from './agent-grant.rules';

const REVOKED_AGENT_HAS_NO_GRANTS = 'A revoked agent cannot receive grants';

export interface GrantCapabilityInput {
  agentId: string;
  capabilityKey: string;
  reason?: string | null;
  expiresAt?: Date | null;
}

export interface GrantScopeInput {
  agentId: string;
  scopeType: AiScopeType;
  scopeId?: string | null;
  resourceType?: string | null;
  reason?: string | null;
  expiresAt?: Date | null;
}

/**
 * Capability grants answer "what may this actor do"; resource scopes answer
 * "where may it do it". They are stored separately and evaluated together, so a
 * capability never implies all resources and a scope never implies all actions.
 *
 * AI principals are never written into `ResourceAccessGrant`, which stays
 * employee-only. Every grant change commits together with its audit row, so an
 * active grant without a trail is not a reachable state.
 */
@Injectable()
export class AgentGrantService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AiPlatformAuditService,
  ) {}

  async grantCapability(
    input: GrantCapabilityInput,
    actingEmployeeId: string,
  ): Promise<AgentCapabilityGrantView> {
    if (!isAiCapabilityKey(input.capabilityKey)) {
      throw new BadRequestException('Unknown capability');
    }
    const reason = normalizeGrantReason(input.reason);
    const expiresAt = input.expiresAt ?? null;

    const grant = await this.prisma.$transaction(async (tx) => {
      await lockLiveAgent(tx, input.agentId, REVOKED_AGENT_HAS_NO_GRANTS);
      const upserted = await tx.externalAgentCapabilityGrant.upsert({
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
      await this.auditGrant(tx, {
        entityType: AI_AUDIT_ENTITY.capabilityGrant,
        entityId: upserted.id,
        action: AI_AUDIT_ACTION.capabilityGranted,
        actingEmployeeId,
        changes: {
          agentId: input.agentId,
          capabilityKey: input.capabilityKey,
          expiresAt: expiresAt?.toISOString() ?? null,
        },
      });
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
      const existing = await tx.externalAgentCapabilityGrant.findUnique({
        where: { agentId_capabilityKey: { agentId, capabilityKey } },
      });
      if (!existing) {
        throw new NotFoundException('Capability grant not found');
      }
      if (existing.revokedAt !== null) {
        return existing;
      }

      const revoked = await tx.externalAgentCapabilityGrant.update({
        where: { id: existing.id },
        data: { revokedAt: new Date(), revokedById: actingEmployeeId },
      });
      await this.auditGrant(tx, {
        entityType: AI_AUDIT_ENTITY.capabilityGrant,
        entityId: revoked.id,
        action: AI_AUDIT_ACTION.capabilityRevoked,
        actingEmployeeId,
        changes: { agentId, capabilityKey },
      });
      return revoked;
    });

    return toAgentCapabilityGrantView(grant);
  }

  async grantScope(
    input: GrantScopeInput,
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
      await lockLiveAgent(tx, input.agentId, REVOKED_AGENT_HAS_NO_GRANTS);
      const upserted = await tx.externalAgentResourceScope.upsert({
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
      await this.auditGrant(tx, {
        entityType: AI_AUDIT_ENTITY.resourceScope,
        entityId: upserted.id,
        action: AI_AUDIT_ACTION.scopeGranted,
        actingEmployeeId,
        changes: { ...key, expiresAt: expiresAt?.toISOString() ?? null },
      });
      return upserted;
    });

    return toAgentResourceScopeView(scope);
  }

  async revokeScope(
    scopeRecordId: string,
    actingEmployeeId: string,
  ): Promise<AgentResourceScopeView> {
    const scope = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.externalAgentResourceScope.findUnique({
        where: { id: scopeRecordId },
      });
      if (!existing) {
        throw new NotFoundException('Resource scope not found');
      }
      if (existing.revokedAt !== null) {
        return existing;
      }

      const revoked = await tx.externalAgentResourceScope.update({
        where: { id: scopeRecordId },
        data: { revokedAt: new Date(), revokedById: actingEmployeeId },
      });
      await this.auditGrant(tx, {
        entityType: AI_AUDIT_ENTITY.resourceScope,
        entityId: revoked.id,
        action: AI_AUDIT_ACTION.scopeRevoked,
        actingEmployeeId,
        changes: {
          agentId: existing.agentId,
          scopeType: existing.scopeType,
          scopeId: existing.scopeId,
        },
      });
      return revoked;
    });

    return toAgentResourceScopeView(scope);
  }

  async listCapabilities(agentId: string): Promise<AgentCapabilityGrantView[]> {
    const grants = await this.prisma.externalAgentCapabilityGrant.findMany({
      where: { agentId },
      orderBy: { capabilityKey: 'asc' },
    });
    return grants.map((grant) => toAgentCapabilityGrantView(grant));
  }

  async listScopes(agentId: string): Promise<AgentResourceScopeView[]> {
    const scopes = await this.prisma.externalAgentResourceScope.findMany({
      where: { agentId },
      orderBy: { createdAt: 'asc' },
    });
    return scopes.map((scope) => toAgentResourceScopeView(scope));
  }

  private async auditGrant(
    tx: PrismaTransaction,
    params: {
      entityType: string;
      entityId: string;
      action: string;
      actingEmployeeId: string;
      changes: Record<string, string | null>;
    },
  ): Promise<void> {
    await this.audit.logAdminAction(
      {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        actingEmployeeId: params.actingEmployeeId,
        changes: params.changes,
      },
      tx,
    );
  }
}
