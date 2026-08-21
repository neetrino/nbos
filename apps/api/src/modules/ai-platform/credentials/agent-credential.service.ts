import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import { type PrismaTransaction } from '../agents/agent-row-lock';
import {
  toAgentCredentialView,
  type AgentCredentialView,
  type IssuedAgentCredential,
} from '../agents/external-agent.mapper';
import {
  claimRotationPredecessor,
  lockCredentialRow,
  lockIssuableAgent,
  resolveCredentialAgent,
} from './agent-credential.locks';
import { normalizeCredentialLabel, resolveOverlapWindow } from './agent-credential.rules';
import { hashAgentSecret } from './agent-secret-hash';
import { generateAgentToken, type GeneratedAgentToken } from './agent-token';

export interface IssueCredentialInput {
  agentId: string;
  label?: string | null;
  expiresAt?: Date | null;
}

export interface RotateCredentialInput {
  credentialId: string;
  /** Grace window during which the previous credential still authenticates. */
  previousValidUntil?: Date | null;
  expiresAt?: Date | null;
}

/**
 * External Agent credential issuance, rotation and revocation.
 *
 * The raw token is returned exactly once and is never persisted, logged or
 * audited. Only the argon2id verifier plus a public `keyId` and display prefix
 * reach the database.
 *
 * Every mutation commits together with its audit row, so a usable credential
 * without a trail is not a reachable state. Rows are locked `FOR UPDATE` before
 * the state checks, so a concurrent agent revoke or a second rotation of the
 * same predecessor cannot interleave between the check and the write.
 */
@Injectable()
export class AgentCredentialService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AiPlatformAuditService,
  ) {}

  async issue(
    input: IssueCredentialInput,
    actingEmployeeId: string,
  ): Promise<IssuedAgentCredential> {
    const label = normalizeCredentialLabel(input.label);
    const generated = generateAgentToken();
    const secretHash = await hashAgentSecret(generated.secret);
    const now = new Date();

    const credential = await this.prisma.$transaction(async (tx) => {
      await lockIssuableAgent(tx, input.agentId);
      const created = await tx.externalAgentCredential.create({
        data: {
          agentId: input.agentId,
          keyId: generated.keyId,
          tokenPrefix: generated.tokenPrefix,
          secretHash,
          label,
          createdById: actingEmployeeId,
          expiresAt: input.expiresAt ?? null,
        },
      });
      await this.auditCredential(tx, {
        credentialId: created.id,
        action: AI_AUDIT_ACTION.credentialIssued,
        actingEmployeeId,
        changes: {
          agentId: input.agentId,
          keyId: generated.keyId,
          expiresAt: input.expiresAt?.toISOString() ?? null,
        },
      });
      return created;
    });

    return { credential: toAgentCredentialView(credential, now), token: generated.token };
  }

  /**
   * Issues a replacement credential for the same agent. The agent id — and
   * therefore its actor identity, grants and scopes — is unchanged.
   *
   * `previousValidUntil` implements the controlled-overlap window from
   * `01-AI-Actors-Identity-and-Access.md`; without it the old credential is
   * revoked immediately. A predecessor can only be rotated once.
   */
  async rotate(
    input: RotateCredentialInput,
    actingEmployeeId: string,
  ): Promise<IssuedAgentCredential> {
    const generated = generateAgentToken();
    const secretHash = await hashAgentSecret(generated.secret);
    const now = new Date();

    const credential = await this.prisma.$transaction(async (tx) => {
      // Lock order is agent row first, credential row second — the same order
      // agent revoke uses. Reversing it here would let a rotation holding the
      // credential lock wait for the agent lock while a revoke holding the
      // agent lock waits for the credential, which PostgreSQL resolves by
      // killing one transaction instead of returning a domain error.
      const agentId = await resolveCredentialAgent(tx, input.credentialId);
      await lockIssuableAgent(tx, agentId);
      const previous = await claimRotationPredecessor(tx, input.credentialId, agentId);
      const overlapUntil = resolveOverlapWindow({
        requested: input.previousValidUntil,
        currentExpiresAt: previous.expiresAt,
        now,
      });

      await tx.externalAgentCredential.update({
        where: { id: previous.id },
        data:
          overlapUntil === null
            ? { revokedAt: now, revokedById: actingEmployeeId }
            : { expiresAt: overlapUntil },
      });
      const created = await this.createRotated(tx, {
        previousId: previous.id,
        agentId: previous.agentId,
        label: previous.label,
        generated,
        secretHash,
        expiresAt: input.expiresAt ?? null,
        actingEmployeeId,
      });
      await this.auditCredential(tx, {
        credentialId: created.id,
        action: AI_AUDIT_ACTION.credentialRotated,
        actingEmployeeId,
        changes: {
          agentId: previous.agentId,
          keyId: generated.keyId,
          rotatedFromId: previous.id,
          rotatedFromKeyId: previous.keyId,
          previousValidUntil: overlapUntil?.toISOString() ?? null,
        },
      });
      return created;
    });

    return { credential: toAgentCredentialView(credential, now), token: generated.token };
  }

  async revoke(credentialId: string, actingEmployeeId: string): Promise<AgentCredentialView> {
    const now = new Date();
    const credential = await this.prisma.$transaction(async (tx) => {
      await lockCredentialRow(tx, credentialId);
      const existing = await tx.externalAgentCredential.findUniqueOrThrow({
        where: { id: credentialId },
      });
      if (existing.revokedAt !== null) {
        return existing;
      }

      const revoked = await tx.externalAgentCredential.update({
        where: { id: credentialId },
        data: { revokedAt: now, revokedById: actingEmployeeId },
      });
      await this.auditCredential(tx, {
        credentialId,
        action: AI_AUDIT_ACTION.credentialRevoked,
        actingEmployeeId,
        changes: { agentId: existing.agentId, keyId: existing.keyId },
      });
      return revoked;
    });

    return toAgentCredentialView(credential, now);
  }

  async listForAgent(agentId: string): Promise<AgentCredentialView[]> {
    const now = new Date();
    const credentials = await this.prisma.externalAgentCredential.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    });
    return credentials.map((credential) => toAgentCredentialView(credential, now));
  }

  private async createRotated(
    tx: PrismaTransaction,
    params: {
      previousId: string;
      agentId: string;
      label: string | null;
      generated: GeneratedAgentToken;
      secretHash: string;
      expiresAt: Date | null;
      actingEmployeeId: string;
    },
  ) {
    return tx.externalAgentCredential.create({
      data: {
        agentId: params.agentId,
        keyId: params.generated.keyId,
        tokenPrefix: params.generated.tokenPrefix,
        secretHash: params.secretHash,
        label: params.label,
        createdById: params.actingEmployeeId,
        rotatedFromId: params.previousId,
        expiresAt: params.expiresAt,
      },
    });
  }

  private async auditCredential(
    tx: PrismaTransaction,
    params: {
      credentialId: string;
      action: string;
      actingEmployeeId: string;
      changes: Record<string, string | null>;
    },
  ): Promise<void> {
    await this.audit.logAdminAction(
      {
        entityType: AI_AUDIT_ENTITY.credential,
        entityId: params.credentialId,
        action: params.action,
        actingEmployeeId: params.actingEmployeeId,
        changes: params.changes,
      },
      tx,
    );
  }
}
