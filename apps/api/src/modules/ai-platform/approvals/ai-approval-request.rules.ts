import { createHash } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import {
  AI_APPROVAL_REASON_MAX_CHARS,
  AI_APPROVAL_TTL_MS,
  assertApprovalPayload,
  buildSafeApprovalSummary,
  canonicalizeApprovalPayload,
  getAiCapability,
  isActorType,
  type ActorType,
  type AiRiskClass,
} from '@nbos/shared';
import type { CreateApprovalRequestInput } from './ai-approval-request.types';

export function digestApprovalPayload(payload: Record<string, unknown>): string {
  return createHash('sha256').update(canonicalizeApprovalPayload(payload), 'utf8').digest('hex');
}

export function requireApprovalPayload(payload: unknown): Record<string, unknown> {
  const checked = assertApprovalPayload(payload);
  if (!checked.ok) {
    throw new BadRequestException(
      checked.reason === 'SECRET_FORBIDDEN'
        ? 'Approval payload must not contain secrets'
        : 'Approval payload must be an object',
    );
  }
  return checked.payload;
}

export function requireRequesterActorType(value: string): ActorType {
  if (!isActorType(value)) {
    throw new BadRequestException('requesterActorType is invalid');
  }
  return value;
}

export function requireCapabilityForApproval(capabilityKey: string) {
  const capability = getAiCapability(capabilityKey);
  if (!capability) {
    throw new BadRequestException('Unknown capability');
  }
  return capability;
}

export function resolveApprovalExpiry(risk: AiRiskClass, now: Date): Date {
  return new Date(now.getTime() + AI_APPROVAL_TTL_MS[risk]);
}

export function normalizeDecisionReason(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > AI_APPROVAL_REASON_MAX_CHARS) {
    throw new BadRequestException('decisionReason is too long');
  }
  return trimmed;
}

export function toPendingWrite(input: CreateApprovalRequestInput, now: Date) {
  const capability = requireCapabilityForApproval(input.capabilityKey);
  const payload = requireApprovalPayload(input.payload);
  const requesterActorType = requireRequesterActorType(input.requesterActorType);
  return {
    requesterActorType,
    requesterActorId: input.requesterActorId,
    onBehalfOfActorType: input.onBehalfOfActorType ?? null,
    onBehalfOfActorId: input.onBehalfOfActorId ?? null,
    capabilityKey: capability.key,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    scopeType: input.scopeType ?? null,
    scopeId: input.scopeId ?? null,
    payloadDigest: digestApprovalPayload(payload),
    safePayloadSummary: buildSafeApprovalSummary(payload),
    riskClass: capability.risk,
    status: 'PENDING' as const,
    requestedAt: now,
    expiresAt: resolveApprovalExpiry(capability.risk, now),
    correlationId: input.correlationId ?? null,
  };
}
