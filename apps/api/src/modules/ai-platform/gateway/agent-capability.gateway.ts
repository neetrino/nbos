import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  AI_CAPABILITIES_FORBIDDEN_PHASE_1,
  getAiCapability,
  projectCapabilityOutput,
  type AiCapabilityDefinition,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import type { TasksDbClient } from '../../tasks/tasks-db-client';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentAccessException } from '../auth/agent-auth.errors';
import {
  mapDomainError,
  readResultEntityId,
  requirePayload,
  resolveIdempotencyKey,
  TRANSACTIONAL_CAPABILITIES,
  type IdempotencyKey,
} from './agent-capability.helpers';
import { pickCapabilityInput, requireCapability } from './agent-capability.input';
import type { AgentCapabilityInvocation, AgentCapabilityResult } from './agent-capability.types';
import { AgentDriveHandler } from './agent-drive.handler';
import { AgentIdempotencyService } from './agent-idempotency.service';
import { fingerprintCapabilityRequest, requireIdempotencyKey } from './agent-idempotency.rules';
import { AgentReplayAuthorization } from './agent-replay-authorization';
import { AgentTaskReadHandler } from './agent-task-read.handler';
import { AgentTaskWriteHandler } from './agent-task-write.handler';
import { AgentWorkspaceHandler } from './agent-workspace.handler';

/**
 * Domain Action Gateway: capability key → policy → Tasks/Drive services → audit.
 * REST and MCP must both call `invoke`. This class never writes Tasks/Drive via
 * Prisma; it holds a client only to open the transaction that domain services
 * and the idempotency checkpoint share.
 */
@Injectable()
export class AgentCapabilityGateway {
  private readonly logger = new Logger(AgentCapabilityGateway.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly workspaces: AgentWorkspaceHandler,
    private readonly taskReads: AgentTaskReadHandler,
    private readonly taskWrites: AgentTaskWriteHandler,
    private readonly drive: AgentDriveHandler,
    private readonly idempotency: AgentIdempotencyService,
    private readonly replayAuthorization: AgentReplayAuthorization,
    private readonly audit: AiPlatformAuditService,
  ) {}

  async invoke(invocation: AgentCapabilityInvocation): Promise<AgentCapabilityResult> {
    this.assertCapabilityAllowed(invocation.capabilityKey);
    const capability = requireCapability(invocation.capabilityKey);
    const input = pickCapabilityInput(capability, invocation.input);
    const reservation = await this.reserveIfRequired(invocation, capability, input);
    if (reservation.replay) {
      await this.replayAuthorization.assertStillAuthorized(invocation.agent, capability, input);
      return reservation.replay;
    }
    return this.dispatchAndFinish(invocation, capability, input, reservation.key);
  }

  private assertCapabilityAllowed(capabilityKey: string): void {
    if ((AI_CAPABILITIES_FORBIDDEN_PHASE_1 as readonly string[]).includes(capabilityKey)) {
      throw AgentAccessException.fromDenyReason('CAPABILITY_UNKNOWN');
    }
    if (!getAiCapability(capabilityKey)) {
      throw AgentAccessException.fromDenyReason('CAPABILITY_UNKNOWN');
    }
  }

  private async dispatchAndFinish(
    invocation: AgentCapabilityInvocation,
    capability: AiCapabilityDefinition,
    input: Record<string, unknown>,
    reservationKey: IdempotencyKey | null,
  ): Promise<AgentCapabilityResult> {
    const state = { domainCommitted: false };
    try {
      const result = await this.commitDomainWithCheckpoint(
        invocation,
        capability,
        input,
        reservationKey,
        state,
      );
      await this.auditSuccess(invocation.agent, capability, result);
      await this.finishReservation(reservationKey, result);
      return result;
    } catch (error) {
      await this.releaseReservation(reservationKey, state.domainCommitted);
      throw error;
    }
  }

  /**
   * Tasks writes commit the domain change and the idempotency checkpoint in one
   * transaction, so no crash can leave the domain committed with the operation
   * key unresolvable — the window that made checklist item 209 fail closed.
   *
   * Drive still cannot share an R2 PutObject with this transaction. Recovery
   * is the Drive Artifact Operation: attach persists identity before upload
   * and resumes through the live attach path, which re-checks fingerprint,
   * original target, and authorization. Do not short-circuit a completed Drive
   * row from reserve — that skipped those checks.
   */
  private async commitDomainWithCheckpoint(
    invocation: AgentCapabilityInvocation,
    capability: AiCapabilityDefinition,
    input: Record<string, unknown>,
    key: IdempotencyKey | null,
    state: { domainCommitted: boolean },
  ): Promise<AgentCapabilityResult> {
    const { agent, payload } = invocation;
    if (key && capability.key === 'tasks.create') {
      const result = await this.commitCreateOutsideLongLock(agent, capability, input, key);
      state.domainCommitted = true;
      return result;
    }
    if (key && TRANSACTIONAL_CAPABILITIES.has(capability.key)) {
      const result = await this.prisma.$transaction(async (tx) => {
        const committed = await this.dispatch(agent, capability, input, payload, tx, key);
        await this.idempotency.checkpointCommittedResult(key, committed, tx);
        return committed;
      });
      state.domainCommitted = true;
      return result;
    }
    const result = await this.dispatch(agent, capability, input, payload, undefined, key);
    state.domainCommitted = true;
    if (key) await this.idempotency.checkpointCommittedResult(key, result);
    return result;
  }

  /**
   * Policy, owner lookup and the counter upsert all commit on their own
   * before `BEGIN`. The interactive transaction then only writes the task
   * and the checkpoint, so it does not hold a pool connection while
   * waiting for another (api `poolMax` is 5).
   */
  private async commitCreateOutsideLongLock(
    agent: AuthenticatedAgent,
    capability: AiCapabilityDefinition,
    input: Record<string, unknown>,
    key: IdempotencyKey,
  ): Promise<AgentCapabilityResult> {
    try {
      const prepared = await this.taskWrites.prepareCreate(agent, input);
      const reservedTaskCode = await this.taskWrites.reserveCreateCode();
      return await this.prisma.$transaction(async (tx) => {
        const data = await this.taskWrites.commitPreparedCreate(prepared, reservedTaskCode, tx);
        const committed = {
          capabilityKey: capability.key,
          data: projectCapabilityOutput(capability, data),
        };
        await this.idempotency.checkpointCommittedResult(key, committed, tx);
        return committed;
      });
    } catch (error) {
      throw mapDomainError(error);
    }
  }

  /**
   * Abort only when the domain call never committed. After a successful
   * Tasks/Drive write, deleting the IN_PROGRESS row would let a retry duplicate.
   */
  private async releaseReservation(
    key: IdempotencyKey | null,
    domainCommitted: boolean,
  ): Promise<void> {
    if (!key) return;
    if (domainCommitted) {
      this.logger.error(
        `Idempotency complete failed after domain commit agent=${key.agentId} capability=${key.capabilityKey}`,
      );
      return;
    }
    await this.idempotency.abort(key);
  }

  private async dispatch(
    agent: AuthenticatedAgent,
    capability: AiCapabilityDefinition,
    input: Record<string, unknown>,
    payload: AgentCapabilityInvocation['payload'],
    tx?: TasksDbClient,
    reservation?: IdempotencyKey | null,
  ): Promise<AgentCapabilityResult> {
    try {
      const data = await this.dispatchDomain(
        agent,
        capability.key,
        input,
        payload,
        tx,
        reservation,
      );
      return { capabilityKey: capability.key, data: projectCapabilityOutput(capability, data) };
    } catch (error) {
      throw mapDomainError(error);
    }
  }

  private async dispatchDomain(
    agent: AuthenticatedAgent,
    key: string,
    input: Record<string, unknown>,
    payload: AgentCapabilityInvocation['payload'],
    tx?: TasksDbClient,
    reservation?: IdempotencyKey | null,
  ): Promise<unknown> {
    switch (key) {
      case 'workspaces.read':
        return this.workspaces.read(agent, input);
      case 'tasks.list':
        return this.taskReads.list(agent, input);
      case 'tasks.read':
        return this.taskReads.read(agent, input);
      case 'tasks.read_links':
        return this.taskReads.readLinks(agent, input);
      case 'tasks.read_discussion':
        return this.taskReads.readDiscussion(agent, input);
      case 'drive.read_task_artifact':
        return this.drive.readTaskArtifact(agent, input);
      case 'tasks.create':
        return this.taskWrites.create(agent, input, tx);
      case 'tasks.update':
        return this.taskWrites.update(agent, input, tx);
      case 'tasks.start':
        return this.taskWrites.start(agent, input, tx);
      case 'tasks.comment':
        return this.taskWrites.comment(agent, input, tx);
      case 'tasks.submit_review':
        return this.taskWrites.submitReview(agent, input, tx);
      case 'tasks.attach_artifact':
        return this.drive.attachArtifact(
          agent,
          input,
          requirePayload(payload),
          reservation
            ? {
                operationKey: reservation.operationKey,
                fingerprint: reservation.requestFingerprint,
              }
            : undefined,
        );
      default:
        throw AgentAccessException.fromDenyReason('CAPABILITY_UNKNOWN');
    }
  }

  private async reserveIfRequired(
    invocation: AgentCapabilityInvocation,
    capability: AiCapabilityDefinition,
    input: Record<string, unknown>,
  ): Promise<{ key: IdempotencyKey | null; replay: AgentCapabilityResult | null }> {
    if (capability.idempotency !== 'REQUIRED') {
      return { key: null, replay: null };
    }
    const operationKey = requireIdempotencyKey(resolveIdempotencyKey(invocation));
    const key = {
      agentId: invocation.agent.agentId,
      capabilityKey: capability.key,
      operationKey,
      requestFingerprint: fingerprintCapabilityRequest(input, invocation.payload?.bytes),
    };
    if (capability.key === 'tasks.attach_artifact') {
      const replay = await this.idempotency.reserve(key, { allowInProgressResume: true });
      return { key, replay };
    }
    const replay = await this.idempotency.reserve(key);
    return { key, replay };
  }

  private async finishReservation(
    key: IdempotencyKey | null,
    result: AgentCapabilityResult,
  ): Promise<void> {
    if (!key) return;
    await this.idempotency.complete(key, result);
  }

  private async auditSuccess(
    agent: AuthenticatedAgent,
    capability: AiCapabilityDefinition,
    result: AgentCapabilityResult,
  ): Promise<void> {
    if (capability.audit !== 'ALWAYS') return;
    try {
      await this.audit.logMachineAction({
        entityType: AI_AUDIT_ENTITY.capability,
        entityId: agent.agentId,
        action: AI_AUDIT_ACTION.capabilityInvoked,
        actor: agent.actor,
        changes: {
          capabilityKey: capability.key,
          resultEntityId: readResultEntityId(result.data),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to audit capability ${capability.key} for agent ${agent.agentId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }
}
