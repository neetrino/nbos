import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AI_MODEL_FALLBACK_REASONS,
  isAiModelStatus,
  isProductionAssignableModelStatus,
  type AiModelFallbackReason,
} from '@nbos/shared';
import { AiModelPolicyService } from './ai-model-policy.service';
import type { PolicyRouteCandidateSnapshot } from './ai-model-policy.snapshot';

export interface ResolvedModelCandidate {
  modelId: string;
  providerModelId: string;
  connectionId: string;
  role: string;
  priority: number;
}

export interface ResolvedModelRoute {
  policyId: string;
  policyVersion: number;
  operationKey: string | null;
  candidates: ResolvedModelCandidate[];
  fallbackReasons: readonly AiModelFallbackReason[];
}

/**
 * Resolves production-eligible candidates from one policy snapshot.
 * Temporarily unavailable fallbacks are skipped. Fallback does not mint a
 * new operation identity — callers keep their existing idempotency key.
 */
@Injectable()
export class AiModelPolicyResolver {
  constructor(private readonly policies: AiModelPolicyService) {}

  async resolveRoute(
    policyId: string,
    operationKey: string | null = null,
  ): Promise<ResolvedModelRoute> {
    const snapshot = await this.policies.loadActiveRouteSnapshot(policyId);
    const candidates = snapshot.candidates
      .filter((row) => row.enabled)
      .flatMap((row) => toEligibleCandidate(row));
    if (candidates.length === 0) {
      throw new BadRequestException('Model policy has no enabled available candidates');
    }
    return {
      policyId: snapshot.id,
      policyVersion: snapshot.version,
      operationKey,
      candidates,
      fallbackReasons: AI_MODEL_FALLBACK_REASONS,
    };
  }
}

function toEligibleCandidate(row: PolicyRouteCandidateSnapshot): ResolvedModelCandidate[] {
  if (!isAiModelStatus(row.model.status) || !isProductionAssignableModelStatus(row.model.status)) {
    return [];
  }
  if (row.model.connection.status !== 'ACTIVE') {
    return [];
  }
  return [
    {
      modelId: row.modelId,
      providerModelId: row.model.providerModelId,
      connectionId: row.model.connection.id,
      role: row.role,
      priority: row.priority,
    },
  ];
}
