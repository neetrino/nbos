import { Inject, Injectable, Logger } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import {
  findExecutionRecordSafetyIssues,
  getAiCapability,
  type ActorContext,
  type AiExecutionKind,
  type AiExecutionRecord,
  type AiExecutionStatus,
  type AiModelFallbackReason,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { toExecutionView } from './ai-execution.mapper';

const RECENT_EXECUTION_LIMIT = 50;

export interface RecordAiExecutionInput {
  kind: AiExecutionKind;
  status: AiExecutionStatus;
  actor: ActorContext;
  externalAgentId?: string | null;
  internalAgentId?: string | null;
  providerConnectionId?: string | null;
  modelId?: string | null;
  modelPolicyId?: string | null;
  modelPolicyVersion?: number | null;
  promptPolicyId?: string | null;
  promptVersionId?: string | null;
  capabilityKey?: string | null;
  retryCount?: number;
  fallbackOccurred?: boolean;
  fallbackReason?: AiModelFallbackReason | null;
  selectedPrimaryModelId?: string | null;
  selectedFallbackModelId?: string | null;
  latencyMs?: number | null;
  errorCode?: string | null;
  inputUnits?: number | null;
  outputUnits?: number | null;
  cachedUnits?: number | null;
  reasoningUnits?: number | null;
  otherUnits?: number | null;
  providerReportedCost?: string | null;
  estimatedCost?: string | null;
  currency?: string | null;
  pricingVersion?: string | null;
  pricingEffectiveOn?: Date | null;
  startedAt: Date;
  completedAt?: Date | null;
}

/**
 * Persists AI execution/usage attribution. Best-effort on the request path:
 * a metrics write must not fail a successful domain commit.
 */
@Injectable()
export class AiExecutionService {
  private readonly logger = new Logger(AiExecutionService.name);

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async record(input: RecordAiExecutionInput): Promise<AiExecutionRecord | null> {
    const write = toExecutionWrite(input);
    if (findExecutionRecordSafetyIssues(write).length > 0) {
      this.logger.error('Refused unsafe AI execution record');
      return null;
    }
    try {
      const created = await this.prisma.aiExecution.create({ data: write });
      return toExecutionView(created);
    } catch (error) {
      this.logger.error(`Failed to persist AI execution: ${String(error)}`);
      return null;
    }
  }

  async listRecent(): Promise<AiExecutionRecord[]> {
    const rows = await this.prisma.aiExecution.findMany({
      orderBy: { startedAt: 'desc' },
      take: RECENT_EXECUTION_LIMIT,
    });
    return rows.map(toExecutionView);
  }
}

function toExecutionWrite(input: RecordAiExecutionInput) {
  const capability = input.capabilityKey ? getAiCapability(input.capabilityKey) : undefined;
  return {
    kind: input.kind,
    status: input.status,
    actorType: input.actor.actor.type,
    actorId: input.actor.actor.id,
    onBehalfOfActorType: input.actor.onBehalfOf?.type ?? null,
    onBehalfOfActorId: input.actor.onBehalfOf?.id ?? null,
    externalAgentId: input.externalAgentId ?? null,
    internalAgentId: input.internalAgentId ?? null,
    providerConnectionId: input.providerConnectionId ?? null,
    modelId: input.modelId ?? null,
    modelPolicyId: input.modelPolicyId ?? null,
    modelPolicyVersion: input.modelPolicyVersion ?? null,
    promptPolicyId: input.promptPolicyId ?? null,
    promptVersionId: input.promptVersionId ?? null,
    capabilityKey: input.capabilityKey ?? null,
    domainModule: capability?.module ?? null,
    channel: input.actor.channel?.source ?? null,
    correlationId: input.actor.correlationId ?? null,
    retryCount: input.retryCount ?? 0,
    fallbackOccurred: input.fallbackOccurred ?? false,
    fallbackReason: input.fallbackReason ?? null,
    selectedPrimaryModelId: input.selectedPrimaryModelId ?? null,
    selectedFallbackModelId: input.selectedFallbackModelId ?? null,
    latencyMs: input.latencyMs ?? null,
    errorCode: input.errorCode ?? null,
    inputUnits: input.inputUnits ?? null,
    outputUnits: input.outputUnits ?? null,
    cachedUnits: input.cachedUnits ?? null,
    reasoningUnits: input.reasoningUnits ?? null,
    otherUnits: input.otherUnits ?? null,
    providerReportedCost: decimalOrNull(input.providerReportedCost),
    estimatedCost: decimalOrNull(input.estimatedCost),
    currency: input.currency ?? null,
    pricingVersion: input.pricingVersion ?? null,
    pricingEffectiveOn: input.pricingEffectiveOn ?? null,
    startedAt: input.startedAt,
    completedAt: input.completedAt ?? null,
  };
}

function decimalOrNull(value: string | null | undefined): Decimal | null {
  if (value === null || value === undefined) return null;
  return new Decimal(value);
}
