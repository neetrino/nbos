import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  evaluateAiPolicy,
  getAiCapability,
  type ActorContext,
  type AgentGrantedScope,
  type AiAgentState,
  type AiCapabilityGrantState,
  type AiCredentialState,
  type AiDataClassification,
  type AiPolicyAllowDecision,
  type AiPolicyDecision,
  type AiResourceTarget,
  type AiRiskClass,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { isTimestampPast, resolveGrantState } from '../agents/external-agent-state';
import { canonicalWorkspaceScopeId } from '../../tasks/work-space-canonical.op';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import { AgentAccessException } from '../auth/agent-auth.errors';

/**
 * The agent id is intentionally absent: it is derived from `actor`, so a caller
 * cannot ask for a decision about one principal while presenting another.
 */
export interface AgentPolicyQuery {
  actor: ActorContext;
  agentState: AiAgentState;
  credentialState: AiCredentialState;
  capabilityKey: string;
  target: AiResourceTarget;
  targetDataClassification?: AiDataClassification | null;
  restrictedModules?: readonly string[];
  maxRiskClass?: AiRiskClass;
  rateLimitExceeded?: boolean;
  approvalGranted?: boolean;
}

/**
 * The single authorization entry point for AI actors.
 *
 * Loads persisted grant/scope state, then delegates the decision to the pure
 * `evaluateAiPolicy` evaluator. REST and MCP adapters must both call this;
 * neither may implement its own permission logic.
 */
@Injectable()
export class AgentPolicyService {
  private readonly logger = new Logger(AgentPolicyService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AiPlatformAuditService,
  ) {}

  async evaluate(query: AgentPolicyQuery): Promise<AiPolicyDecision> {
    const agentId = this.resolveAgentId(query.actor);
    if (!agentId) {
      return { outcome: 'DENY', reason: 'ACTOR_NOT_SUPPORTED' };
    }

    const now = new Date();
    const capability = getAiCapability(query.capabilityKey);
    const [grant, scopes] = await Promise.all([
      this.loadGrantState(agentId, query.capabilityKey, now),
      this.loadActiveScopes(agentId, now),
    ]);

    return evaluateAiPolicy({
      actor: query.actor,
      capabilityKey: query.capabilityKey,
      capability,
      agentState: query.agentState,
      credentialState: query.credentialState,
      grant,
      scopes,
      target: query.target,
      targetDataClassification: query.targetDataClassification ?? null,
      restrictedModules: query.restrictedModules,
      maxRiskClass: query.maxRiskClass,
      rateLimitExceeded: query.rateLimitExceeded,
      approvalGranted: query.approvalGranted,
    });
  }

  /**
   * Evaluates and throws a safe external error on anything but ALLOW.
   * Denials are audited with the machine actor so the trail shows who was
   * refused what, without leaking whether the target record exists.
   */
  async assertAllowed(query: AgentPolicyQuery): Promise<AiPolicyAllowDecision> {
    const decision = await this.evaluate(query);
    if (decision.outcome === 'ALLOW') {
      return decision;
    }
    if (decision.outcome === 'REQUIRE_APPROVAL') {
      await this.auditDenial(query, 'APPROVAL_REQUIRED');
      throw AgentAccessException.approvalRequired();
    }
    if (decision.reason !== 'RATE_LIMITED') {
      await this.auditDenial(query, decision.reason);
    }
    throw AgentAccessException.fromDenyReason(decision.reason);
  }

  /** Grants and scopes belong to an External Agent, so only that actor has any. */
  private resolveAgentId(actor: ActorContext): string | null {
    return actor.actor.type === 'EXTERNAL_AGENT' ? actor.actor.id : null;
  }

  private async loadGrantState(
    agentId: string,
    capabilityKey: string,
    now: Date,
  ): Promise<AiCapabilityGrantState | null> {
    const grant = await this.prisma.externalAgentCapabilityGrant.findUnique({
      where: { agentId_capabilityKey: { agentId, capabilityKey } },
      select: { capabilityKey: true, revokedAt: true, expiresAt: true },
    });
    return grant ? resolveGrantState(grant, now) : null;
  }

  private async loadActiveScopes(agentId: string, now: Date): Promise<AgentGrantedScope[]> {
    const scopes = await this.prisma.externalAgentResourceScope.findMany({
      where: { agentId, revokedAt: null },
      select: { scopeType: true, scopeId: true, resourceType: true, expiresAt: true },
    });
    const live = scopes.filter((scope) => !isTimestampPast(scope.expiresAt, now));
    return Promise.all(live.map((scope) => this.toGrantedScope(scope)));
  }

  private async toGrantedScope(scope: {
    scopeType: AgentGrantedScope['scopeType'];
    scopeId: string;
    resourceType: string;
  }): Promise<AgentGrantedScope> {
    return {
      scopeType: scope.scopeType,
      scopeId: await canonicalWorkspaceScopeId(this.prisma, scope.scopeType, scope.scopeId),
      resourceType: scope.resourceType || null,
    };
  }

  /**
   * A denial must stay a denial. If the audit write fails the access decision is
   * unchanged, so the failure is logged and the caller still receives the safe
   * deterministic agent error rather than an internal server error.
   */
  private async auditDenial(query: AgentPolicyQuery, reason: string): Promise<void> {
    try {
      await this.audit.logMachineAction({
        entityType: AI_AUDIT_ENTITY.agent,
        entityId: query.actor.actor.id,
        action: AI_AUDIT_ACTION.policyDenied,
        actor: query.actor,
        changes: {
          capabilityKey: query.capabilityKey,
          reason,
          workspaceId: query.target.workspaceId ?? null,
          resourceType: query.target.resourceType ?? null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to audit policy denial agentId=${query.actor.actor.id} capability=${query.capabilityKey} reason=${reason}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }
}
