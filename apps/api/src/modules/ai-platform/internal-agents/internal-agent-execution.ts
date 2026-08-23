import { BadRequestException } from '@nestjs/common';
import {
  actorContextFromInternalAgent,
  canStartInternalAgentExecution,
  INTERNAL_AI_SURFACE_CHANNEL,
  isInternalAiAgentSurface,
  type ActorContext,
  type AiPromptVersionAttribution,
  type InternalAiAgentStatus,
  type InternalAiAgentSurface,
} from '@nbos/shared';

export interface InternalAgentExecutionSource {
  id: string;
  name: string;
  status: InternalAiAgentStatus;
}

export interface InternalAgentExecutionInput {
  surface: InternalAiAgentSurface | string;
  onBehalfOfEmployeeId?: string | null;
  correlationId?: string | null;
}

/**
 * Builds an INTERNAL_AI ActorContext. Pause/disable/archive throw before a
 * caller can reach domain services. Model identity is not an input.
 */
export function assertInternalAgentCanExecute(agent: InternalAgentExecutionSource): void {
  if (!canStartInternalAgentExecution(agent.status)) {
    throw new BadRequestException('Internal agent is not allowed to start a new execution');
  }
}

export function buildInternalAgentExecutionContext(
  agent: InternalAgentExecutionSource,
  input: InternalAgentExecutionInput,
): ActorContext {
  assertInternalAgentCanExecute(agent);
  if (!isInternalAiAgentSurface(input.surface)) {
    throw new BadRequestException('Unknown Internal Agent surface');
  }
  return actorContextFromInternalAgent(
    { id: agent.id, name: agent.name },
    {
      channel: { source: INTERNAL_AI_SURFACE_CHANNEL[input.surface] },
      correlationId: input.correlationId ?? undefined,
      onBehalfOf: input.onBehalfOfEmployeeId
        ? { id: input.onBehalfOfEmployeeId, type: 'USER' }
        : undefined,
    },
  );
}

export interface InternalAgentExecutionRecord {
  actor: ActorContext;
  prompt: AiPromptVersionAttribution | null;
}

/** Actor plus prompt-version identity. Prompt text never enters ActorContext. */
export function buildInternalAgentExecutionRecord(
  agent: InternalAgentExecutionSource,
  input: InternalAgentExecutionInput,
  prompt: AiPromptVersionAttribution | null,
): InternalAgentExecutionRecord {
  return {
    actor: buildInternalAgentExecutionContext(agent, input),
    prompt,
  };
}
