import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';

/**
 * Narrow surface so a client and a transaction client are interchangeable
 * without TypeScript comparing the two full Prisma types.
 */
export type IdempotencyDbClient = Pick<
  InstanceType<typeof PrismaClient>,
  'externalAgentIdempotencyRecord'
>;
import { PRISMA_TOKEN } from '../../../database.module';
import { AgentAccessException } from '../auth/agent-auth.errors';
import { AGENT_IDEMPOTENCY_TTL_MS } from './agent-capability.constants';
import type { AgentCapabilityResult } from './agent-capability.types';

export interface IdempotencyReserveInput {
  agentId: string;
  capabilityKey: string;
  operationKey: string;
  requestFingerprint: string;
}

export interface IdempotencyReserveOptions {
  /** Evidence-based resume: same fingerprint, no checkpoint, Drive owns recovery. */
  allowInProgressResume?: boolean;
}

interface IdempotencyRow {
  id: string;
  requestFingerprint: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  responseJson: unknown;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Reserves an (agent, capability, key) slot, then stores the successful result.
 * A duplicate retry with the same fingerprint returns the original result.
 */
@Injectable()
export class AgentIdempotencyService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async reserve(
    input: IdempotencyReserveInput,
    options: IdempotencyReserveOptions = {},
  ): Promise<AgentCapabilityResult | null> {
    const existing = await this.loadLive(input);
    if (existing) {
      return this.replayOrRecover(existing, input, options);
    }
    if ((await this.tryInsert(input)) === 'created') {
      return null;
    }
    const raced = await this.loadLive(input);
    if (!raced) {
      throw AgentAccessException.conflict('Idempotency reservation failed');
    }
    return this.replayOrRecover(raced, input, options);
  }

  async abort(input: IdempotencyReserveInput | null): Promise<void> {
    if (!input) return;
    await this.prisma.externalAgentIdempotencyRecord.deleteMany({
      where: {
        agentId: input.agentId,
        capabilityKey: input.capabilityKey,
        operationKey: input.operationKey,
        status: 'IN_PROGRESS',
      },
    });
  }

  async complete(input: IdempotencyReserveInput, result: AgentCapabilityResult): Promise<void> {
    await this.prisma.externalAgentIdempotencyRecord.update({
      where: {
        agentId_capabilityKey_operationKey: {
          agentId: input.agentId,
          capabilityKey: input.capabilityKey,
          operationKey: input.operationKey,
        },
      },
      data: {
        status: 'COMPLETED',
        responseJson: result as unknown as InputJsonValue,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Persists the domain result while the row is still IN_PROGRESS so a crash
   * after Tasks/Drive commit can replay instead of conflicting forever.
   *
   * Pass `tx` to write this in the same transaction as the domain change. That
   * closes the window entirely: without it there is a moment where the domain
   * has committed and the checkpoint has not, and a crash there pins the
   * operation key permanently. Callers that cannot share a transaction — Drive,
   * whose object write is not transactional — still get the narrower guarantee.
   */
  async checkpointCommittedResult(
    input: IdempotencyReserveInput,
    result: AgentCapabilityResult,
    tx?: IdempotencyDbClient,
  ): Promise<void> {
    await (tx ?? this.prisma).externalAgentIdempotencyRecord.updateMany({
      where: {
        agentId: input.agentId,
        capabilityKey: input.capabilityKey,
        operationKey: input.operationKey,
        status: 'IN_PROGRESS',
      },
      data: {
        responseJson: result as unknown as InputJsonValue,
      },
    });
  }

  private async loadLive(input: IdempotencyReserveInput): Promise<IdempotencyRow | null> {
    const row = await this.findRow(input);
    if (!row) return null;
    if (row.status === 'IN_PROGRESS') {
      return row;
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      await this.prisma.externalAgentIdempotencyRecord
        .delete({ where: { id: row.id } })
        .catch(() => undefined);
      return null;
    }
    return row;
  }

  private async findRow(input: IdempotencyReserveInput): Promise<IdempotencyRow | null> {
    return this.prisma.externalAgentIdempotencyRecord.findUnique({
      where: {
        agentId_capabilityKey_operationKey: {
          agentId: input.agentId,
          capabilityKey: input.capabilityKey,
          operationKey: input.operationKey,
        },
      },
      select: {
        id: true,
        requestFingerprint: true,
        status: true,
        responseJson: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }

  private async tryInsert(input: IdempotencyReserveInput): Promise<'created' | 'conflict'> {
    try {
      await this.prisma.externalAgentIdempotencyRecord.create({
        data: {
          agentId: input.agentId,
          capabilityKey: input.capabilityKey,
          operationKey: input.operationKey,
          requestFingerprint: input.requestFingerprint,
          status: 'IN_PROGRESS',
          expiresAt: new Date(Date.now() + AGENT_IDEMPOTENCY_TTL_MS),
        },
      });
      return 'created';
    } catch {
      return 'conflict';
    }
  }

  private async replayOrRecover(
    row: IdempotencyRow,
    input: IdempotencyReserveInput,
    options: IdempotencyReserveOptions = {},
  ): Promise<AgentCapabilityResult | null> {
    if (row.requestFingerprint !== input.requestFingerprint) {
      throw AgentAccessException.idempotencyConflict();
    }
    if (row.status === 'COMPLETED') {
      return row.responseJson as AgentCapabilityResult;
    }
    if (!row.responseJson) {
      if (options.allowInProgressResume) return null;
      throw AgentAccessException.idempotencyInProgress();
    }
    const result = row.responseJson as AgentCapabilityResult;
    await this.complete(input, result).catch(() => undefined);
    return result;
  }
}
