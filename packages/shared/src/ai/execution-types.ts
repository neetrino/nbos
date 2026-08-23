import type { ActorType } from '../actor';
import type { AiModelFallbackReason } from './model-policy-types';

export const AI_EXECUTION_KINDS = ['CAPABILITY', 'MODEL_INVOCATION'] as const;

export type AiExecutionKind = (typeof AI_EXECUTION_KINDS)[number];

export const AI_EXECUTION_STATUSES = [
  'STARTED',
  'SUCCEEDED',
  'FAILED',
  'RATE_LIMITED',
  'CANCELLED',
] as const;

export type AiExecutionStatus = (typeof AI_EXECUTION_STATUSES)[number];

export function isAiExecutionKind(value: string): value is AiExecutionKind {
  return (AI_EXECUTION_KINDS as readonly string[]).includes(value);
}

export function isAiExecutionStatus(value: string): value is AiExecutionStatus {
  return (AI_EXECUTION_STATUSES as readonly string[]).includes(value);
}

export interface AiExecutionActorRef {
  actorType: ActorType;
  actorId: string;
}

/**
 * Attribution for one AI execution. IDs and counts only — never prompt text,
 * completion text, provider keys or agent tokens.
 */
export interface AiExecutionAttribution {
  actor: AiExecutionActorRef;
  onBehalfOf: AiExecutionActorRef | null;
  externalAgentId: string | null;
  internalAgentId: string | null;
  providerConnectionId: string | null;
  modelId: string | null;
  modelPolicyId: string | null;
  modelPolicyVersion: number | null;
  promptPolicyId: string | null;
  promptVersionId: string | null;
  capabilityKey: string | null;
  domainModule: string | null;
  channel: string | null;
  correlationId: string | null;
}

export interface AiExecutionUsageSnapshot {
  inputUnits: number | null;
  outputUnits: number | null;
  cachedUnits: number | null;
  reasoningUnits: number | null;
  otherUnits: number | null;
  providerReportedCost: string | null;
  estimatedCost: string | null;
  currency: string | null;
  pricingVersion: string | null;
  pricingEffectiveOn: Date | null;
}

export interface AiExecutionRecord extends AiExecutionAttribution, AiExecutionUsageSnapshot {
  id: string;
  kind: AiExecutionKind;
  status: AiExecutionStatus;
  retryCount: number;
  fallbackOccurred: boolean;
  fallbackReason: AiModelFallbackReason | null;
  selectedPrimaryModelId: string | null;
  selectedFallbackModelId: string | null;
  latencyMs: number | null;
  errorCode: string | null;
  startedAt: Date;
  completedAt: Date | null;
}
