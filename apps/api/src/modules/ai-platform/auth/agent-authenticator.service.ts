import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  actorContextFromMachine,
  agentStateDenyReason,
  credentialStateDenyReason,
  toAgentExternalError,
  type ActorChannelSource,
  type ActorContext,
  type AiAgentState,
  type AiCredentialState,
  type AiPolicyDenyReason,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { resolveAgentState, resolveCredentialState } from '../agents/external-agent-state';
import { verifyAgainstDecoySecret, verifyAgentSecret } from '../credentials/agent-secret-hash';
import { parseAgentToken } from '../credentials/agent-token';
import { AgentAccessException } from './agent-auth.errors';

export interface AgentAuthRequestContext {
  channel: ActorChannelSource;
  protocol?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
  requestId?: string | null;
}

export interface AuthenticatedAgent {
  agentId: string;
  agentName: string;
  agentState: AiAgentState;
  credentialId: string;
  credentialKeyId: string;
  credentialState: AiCredentialState;
  actor: ActorContext;
}

type CredentialWithAgent = NonNullable<
  Awaited<ReturnType<AgentAuthenticatorService['loadCredential']>>
>;

/**
 * Authenticates External Agent bearer credentials.
 *
 * This is deliberately independent from `AuthGuard` / `EmployeeGuard`: an agent
 * token is not a JWT and never produces `request.user`, so agent traffic can
 * never acquire employee RBAC, and an employee JWT can never authenticate here.
 */
@Injectable()
export class AgentAuthenticatorService {
  private readonly logger = new Logger(AgentAuthenticatorService.name);

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async authenticate(
    rawToken: string,
    context: AgentAuthRequestContext,
  ): Promise<AuthenticatedAgent> {
    const credential = await this.verifyPresentedToken(rawToken, context);
    const now = new Date();
    const agentState = resolveAgentState(credential.agent, now);
    const credentialState = resolveCredentialState(credential, now);
    this.assertUsable(credential, agentState, credentialState, context);

    await this.recordUsage(credential.id, credential.agentId, context, now);
    return {
      agentId: credential.agent.id,
      agentName: credential.agent.name,
      agentState,
      credentialId: credential.id,
      credentialKeyId: credential.keyId,
      credentialState,
      actor: this.buildActor(credential, context),
    };
  }

  /**
   * Resolves the presented token to a credential row.
   *
   * A malformed token never reaches the database, and an unknown key id runs the
   * same verification against a decoy verifier, so "no such key" and "wrong
   * secret" cost the same and look the same.
   */
  private async verifyPresentedToken(
    rawToken: string,
    context: AgentAuthRequestContext,
  ): Promise<CredentialWithAgent> {
    const parsed = parseAgentToken(rawToken);
    if (!parsed) {
      this.logFailure('malformed_token', null, context);
      throw this.invalidCredential();
    }

    const credential = await this.loadCredential(parsed.keyId);
    if (!credential) {
      await verifyAgainstDecoySecret(parsed.secret);
      this.logFailure('unknown_key', parsed.keyId, context);
      throw this.invalidCredential();
    }

    const secretMatches = await verifyAgentSecret(credential.secretHash, parsed.secret);
    if (!secretMatches) {
      this.logFailure('secret_mismatch', credential.keyId, context);
      throw this.invalidCredential();
    }
    return credential;
  }

  private loadCredential(keyId: string) {
    return this.prisma.externalAgentCredential.findUnique({
      where: { keyId },
      include: {
        agent: {
          select: { id: true, name: true, status: true, expiresAt: true, revokedAt: true },
        },
      },
    });
  }

  private assertUsable(
    credential: CredentialWithAgent,
    agentState: AiAgentState,
    credentialState: AiCredentialState,
    context: AgentAuthRequestContext,
  ): void {
    const denial = agentStateDenyReason(agentState) ?? credentialStateDenyReason(credentialState);
    if (!denial) {
      return;
    }
    this.logFailure(denial, credential.keyId, context, credential.agentId);
    throw AgentAccessException.fromDenyReason(denial);
  }

  private buildActor(
    credential: CredentialWithAgent,
    context: AgentAuthRequestContext,
  ): ActorContext {
    return actorContextFromMachine(
      { id: credential.agent.id, type: 'EXTERNAL_AGENT', displayName: credential.agent.name },
      {
        channel: { source: context.channel, protocol: context.protocol ?? null },
        correlationId: context.correlationId ?? null,
        requestId: context.requestId ?? null,
        client: {
          ipAddress: context.ipAddress ?? null,
          userAgent: context.userAgent ?? null,
          // Public key id only. The raw secret never leaves the request.
          credentialId: credential.keyId,
        },
      },
    );
  }

  private invalidCredential(): AgentAccessException {
    return new AgentAccessException(toAgentExternalError('CREDENTIAL_INVALID'));
  }

  /**
   * Structured, secret-free observability for every rejected authentication.
   *
   * Deliberately a log and not an AuditLog row: unauthenticated traffic is
   * attacker-controlled and unbounded, so writing a database row per attempt
   * would hand an anonymous caller a write amplifier. Refusals of a *known*
   * credential are additionally visible through the agent's own lifecycle trail.
   */
  private logFailure(
    reason: AiPolicyDenyReason | 'malformed_token' | 'unknown_key' | 'secret_mismatch',
    keyId: string | null,
    context: AgentAuthRequestContext,
    agentId?: string,
  ): void {
    this.logger.warn(
      JSON.stringify({
        event: 'agent.auth_failed',
        reason,
        keyId,
        agentId: agentId ?? null,
        channel: context.channel,
        ipAddress: context.ipAddress ?? null,
        correlationId: context.correlationId ?? null,
      }),
    );
  }

  /** Best-effort telemetry. A failure here must never break an authorized call. */
  private async recordUsage(
    credentialId: string,
    agentId: string,
    context: AgentAuthRequestContext,
    now: Date,
  ): Promise<void> {
    try {
      await this.prisma.$transaction([
        this.prisma.externalAgentCredential.update({
          where: { id: credentialId },
          data: { lastUsedAt: now },
        }),
        this.prisma.externalAgent.update({
          where: { id: agentId },
          data: {
            lastUsedAt: now,
            lastUsedIp: context.ipAddress ?? null,
            lastUsedChannel: context.channel,
          },
        }),
      ]);
    } catch (error) {
      this.logger.warn(
        `Failed to record agent usage agentId=${agentId}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}
