import { BadRequestException } from '@nestjs/common';
import {
  isAiModelPolicyMode,
  isPhase1ModelPolicyMode,
  type AiModelPolicyCandidateRole,
  type AiModelPolicyMode,
} from '@nbos/shared';
import { requireAgentName } from '../agents/external-agent.rules';
import { normalizeAgentDescription } from '../agents/external-agent.rules';

export interface PolicyCandidateInput {
  modelId: string;
  role: AiModelPolicyCandidateRole;
  priority: number;
  enabled?: boolean;
}

export function requirePolicyMode(value: string): AiModelPolicyMode {
  if (!isAiModelPolicyMode(value)) {
    throw new BadRequestException('Unknown model policy mode');
  }
  if (!isPhase1ModelPolicyMode(value)) {
    throw new BadRequestException('TIERED and ADAPTIVE routing are not implemented in Phase 1');
  }
  return value;
}

export function requirePolicyName(value: string): string {
  return requireAgentName(value);
}

export function normalizePolicyPurpose(
  value: string | null | undefined,
): string | null | undefined {
  return normalizeAgentDescription(value);
}

export function validateCandidateShape(
  mode: AiModelPolicyMode,
  candidates: PolicyCandidateInput[],
): void {
  if (new Set(candidates.map((item) => item.modelId)).size !== candidates.length) {
    throw new BadRequestException('A model may appear only once in a policy');
  }
  if (new Set(candidates.map((item) => item.priority)).size !== candidates.length) {
    throw new BadRequestException('Candidate priorities must be unique');
  }
  if (candidates.some((item) => !Number.isInteger(item.priority) || item.priority < 0)) {
    throw new BadRequestException('Candidate priority must be a non-negative integer');
  }
  if (mode === 'FIXED') {
    validateFixedCandidates(candidates);
    return;
  }
  if (mode === 'PRIMARY_FALLBACK') {
    validateFallbackCandidates(candidates);
  }
}

function validateFixedCandidates(candidates: PolicyCandidateInput[]): void {
  if (candidates.length !== 1 || candidates[0]?.role !== 'PRIMARY') {
    throw new BadRequestException('FIXED policy requires exactly one PRIMARY candidate');
  }
  if (candidates[0].enabled === false) {
    throw new BadRequestException('FIXED policy requires an enabled PRIMARY');
  }
}

function validateFallbackCandidates(candidates: PolicyCandidateInput[]): void {
  const primaries = candidates.filter((item) => item.role === 'PRIMARY');
  const fallbacks = candidates.filter((item) => item.role === 'FALLBACK');
  if (primaries.length !== 1 || fallbacks.length < 1) {
    throw new BadRequestException(
      'PRIMARY_FALLBACK requires one PRIMARY and at least one FALLBACK',
    );
  }
  if (candidates.some((item) => item.role !== 'PRIMARY' && item.role !== 'FALLBACK')) {
    throw new BadRequestException('PRIMARY_FALLBACK cannot use TIERED candidate roles');
  }
  assertEnabledPrimaryHasLowestPriority(candidates);
}

function assertEnabledPrimaryHasLowestPriority(candidates: PolicyCandidateInput[]): void {
  const enabled = candidates.filter((item) => item.enabled !== false);
  const enabledPrimaries = enabled.filter((item) => item.role === 'PRIMARY');
  if (enabledPrimaries.length !== 1) {
    throw new BadRequestException('PRIMARY_FALLBACK requires exactly one enabled PRIMARY');
  }
  const primary = enabledPrimaries[0];
  if (!primary) {
    throw new BadRequestException('PRIMARY_FALLBACK requires exactly one enabled PRIMARY');
  }
  const lowestPriority = Math.min(...enabled.map((item) => item.priority));
  if (primary.priority !== lowestPriority) {
    throw new BadRequestException('PRIMARY must have the lowest priority among enabled candidates');
  }
}
