import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AgentAccessException } from '../auth/agent-auth.errors';
import type { AgentCapabilityInvocation } from './agent-capability.types';

/**
 * Capabilities whose domain change is nothing but database writes, so it can
 * share a transaction with the idempotency checkpoint. `tasks.attach_artifact`
 * is deliberately absent: it writes to object storage as well.
 */
export const TRANSACTIONAL_CAPABILITIES: ReadonlySet<string> = new Set([
  'tasks.create',
  'tasks.update',
  'tasks.start',
  'tasks.comment',
  'tasks.submit_review',
]);

export type IdempotencyKey = {
  agentId: string;
  capabilityKey: string;
  operationKey: string;
  requestFingerprint: string;
};

export function resolveIdempotencyKey(invocation: AgentCapabilityInvocation): string | null {
  if (invocation.idempotencyKey) return invocation.idempotencyKey;
  const fromInput = invocation.input.clientOperationId ?? invocation.input.idempotencyKey;
  return typeof fromInput === 'string' ? fromInput : null;
}

export function requirePayload(payload: AgentCapabilityInvocation['payload']): Uint8Array {
  if (!payload?.bytes || payload.bytes.byteLength === 0) {
    throw AgentAccessException.validationFailed('Artifact content is required');
  }
  return payload.bytes;
}

export function readResultEntityId(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (typeof record.id === 'string') return record.id;
  if (typeof record.fileAssetId === 'string') return record.fileAssetId;
  return null;
}

export function mapDomainError(error: unknown): unknown {
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
