import type { ActorType } from '@nbos/shared';
import type { AiExecutionKind, AiExecutionRecord, AiExecutionStatus } from '@nbos/shared';
import type { AiModelFallbackReason } from '@nbos/shared';

export type AiExecutionRow = {
  id: string;
  kind: AiExecutionKind;
  status: AiExecutionStatus;
  actorType: string;
  actorId: string;
  onBehalfOfActorType: string | null;
  onBehalfOfActorId: string | null;
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
  retryCount: number;
  fallbackOccurred: boolean;
  fallbackReason: string | null;
  selectedPrimaryModelId: string | null;
  selectedFallbackModelId: string | null;
  latencyMs: number | null;
  errorCode: string | null;
  inputUnits: number | null;
  outputUnits: number | null;
  cachedUnits: number | null;
  reasoningUnits: number | null;
  otherUnits: number | null;
  providerReportedCost: { toString(): string } | null;
  estimatedCost: { toString(): string } | null;
  currency: string | null;
  pricingVersion: string | null;
  pricingEffectiveOn: Date | null;
  startedAt: Date;
  completedAt: Date | null;
};

export function toExecutionView(row: AiExecutionRow): AiExecutionRecord {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    actor: { actorType: row.actorType as ActorType, actorId: row.actorId },
    onBehalfOf:
      row.onBehalfOfActorType && row.onBehalfOfActorId
        ? { actorType: row.onBehalfOfActorType as ActorType, actorId: row.onBehalfOfActorId }
        : null,
    externalAgentId: row.externalAgentId,
    internalAgentId: row.internalAgentId,
    providerConnectionId: row.providerConnectionId,
    modelId: row.modelId,
    modelPolicyId: row.modelPolicyId,
    modelPolicyVersion: row.modelPolicyVersion,
    promptPolicyId: row.promptPolicyId,
    promptVersionId: row.promptVersionId,
    capabilityKey: row.capabilityKey,
    domainModule: row.domainModule,
    channel: row.channel,
    correlationId: row.correlationId,
    retryCount: row.retryCount,
    fallbackOccurred: row.fallbackOccurred,
    fallbackReason: (row.fallbackReason as AiModelFallbackReason | null) ?? null,
    selectedPrimaryModelId: row.selectedPrimaryModelId,
    selectedFallbackModelId: row.selectedFallbackModelId,
    latencyMs: row.latencyMs,
    errorCode: row.errorCode,
    inputUnits: row.inputUnits,
    outputUnits: row.outputUnits,
    cachedUnits: row.cachedUnits,
    reasoningUnits: row.reasoningUnits,
    otherUnits: row.otherUnits,
    providerReportedCost: row.providerReportedCost?.toString() ?? null,
    estimatedCost: row.estimatedCost?.toString() ?? null,
    currency: row.currency,
    pricingVersion: row.pricingVersion,
    pricingEffectiveOn: row.pricingEffectiveOn,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
  };
}
