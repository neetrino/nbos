export const AI_MODEL_POLICY_MODES = ['FIXED', 'PRIMARY_FALLBACK', 'TIERED', 'ADAPTIVE'] as const;

export type AiModelPolicyMode = (typeof AI_MODEL_POLICY_MODES)[number];

/** Phase 1 implements configuration and resolution for these modes only. */
export const AI_MODEL_POLICY_PHASE1_MODES = [
  'FIXED',
  'PRIMARY_FALLBACK',
] as const satisfies readonly AiModelPolicyMode[];

export type AiModelPolicyPhase1Mode = (typeof AI_MODEL_POLICY_PHASE1_MODES)[number];

export const AI_MODEL_POLICY_STATUSES = ['DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED'] as const;

export type AiModelPolicyStatus = (typeof AI_MODEL_POLICY_STATUSES)[number];

export const AI_MODEL_POLICY_CANDIDATE_ROLES = [
  'PRIMARY',
  'FALLBACK',
  'TIER_FAST',
  'TIER_STANDARD',
  'TIER_DEEP',
] as const;

export type AiModelPolicyCandidateRole = (typeof AI_MODEL_POLICY_CANDIDATE_ROLES)[number];

export const AI_MODEL_FALLBACK_REASONS = [
  'PROVIDER_ERROR',
  'RATE_LIMIT',
  'TIMEOUT',
  'UNAVAILABLE',
  'MODEL_DISABLED',
  'CONNECTION_DISABLED',
] as const;

export type AiModelFallbackReason = (typeof AI_MODEL_FALLBACK_REASONS)[number];

export function isAiModelPolicyMode(value: string): value is AiModelPolicyMode {
  return (AI_MODEL_POLICY_MODES as readonly string[]).includes(value);
}

export function isPhase1ModelPolicyMode(mode: AiModelPolicyMode): mode is AiModelPolicyPhase1Mode {
  return (AI_MODEL_POLICY_PHASE1_MODES as readonly AiModelPolicyMode[]).includes(mode);
}
