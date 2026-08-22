import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AI_CAPABILITIES_FORBIDDEN_PHASE_1,
  getAiCapability,
  type AiCapabilityDefinition,
} from '@nbos/shared';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentAccessException } from '../auth/agent-auth.errors';
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
 * REST and MCP must both call `invoke`. This class never writes Tasks/Drive via Prisma.
 */
@Injectable()
export class AgentCapabilityGateway {
  private readonly logger = new Logger(AgentCapabilityGateway.name);

  constructor(
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
    let domainCommitted = false;
    try {
      const result = await this.dispatch(
        invocation.agent,
        capability.key,
        input,
        invocation.payload,
      );
      domainCommitted = true;
      await this.auditSuccess(invocation.agent, capability, result);
      await this.finishReservation(reservationKey, result);
      return result;
    } catch (error) {
      await this.releaseReservation(reservationKey, domainCommitted);
      throw error;
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
    key: string,
    input: Record<string, unknown>,
    payload: AgentCapabilityInvocation['payload'],
  ): Promise<AgentCapabilityResult> {
    try {
      const data = await this.dispatchDomain(agent, key, input, payload);
      return { capabilityKey: key, data };
    } catch (error) {
      throw mapDomainError(error);
    }
  }

  private async dispatchDomain(
    agent: AuthenticatedAgent,
    key: string,
    input: Record<string, unknown>,
    payload: AgentCapabilityInvocation['payload'],
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
        return this.taskWrites.create(agent, input);
      case 'tasks.update':
        return this.taskWrites.update(agent, input);
      case 'tasks.start':
        return this.taskWrites.start(agent, input);
      case 'tasks.comment':
        return this.taskWrites.comment(agent, input);
      case 'tasks.submit_review':
        return this.taskWrites.submitReview(agent, input);
      case 'tasks.attach_artifact':
        return this.drive.attachArtifact(agent, input, requirePayload(payload));
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

type IdempotencyKey = {
  agentId: string;
  capabilityKey: string;
  operationKey: string;
  requestFingerprint: string;
};

function resolveIdempotencyKey(invocation: AgentCapabilityInvocation): string | null {
  if (invocation.idempotencyKey) return invocation.idempotencyKey;
  const fromInput = invocation.input.clientOperationId ?? invocation.input.idempotencyKey;
  return typeof fromInput === 'string' ? fromInput : null;
}

function requirePayload(payload: AgentCapabilityInvocation['payload']): Uint8Array {
  if (!payload?.bytes || payload.bytes.byteLength === 0) {
    throw AgentAccessException.validationFailed('Artifact content is required');
  }
  return payload.bytes;
}

function readResultEntityId(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (typeof record.id === 'string') return record.id;
  if (typeof record.fileAssetId === 'string') return record.fileAssetId;
  return null;
}

function mapDomainError(error: unknown): unknown {
  if (error instanceof AgentAccessException) return error;
  if (error instanceof NotFoundException) {
    return AgentAccessException.resourceNotAvailable();
  }
  if (error instanceof ConflictException) {
    return AgentAccessException.conflict();
  }
  if (error instanceof BadRequestException) {
    const message = typeof error.message === 'string' ? error.message : 'The request is invalid.';
    return AgentAccessException.validationFailed(message);
  }
  return error;
}
