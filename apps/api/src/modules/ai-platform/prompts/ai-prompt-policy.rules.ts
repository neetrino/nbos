import { createHash } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import {
  canonicalizePromptLayers,
  normalizePromptLayers,
  validatePromptLayers,
  type AiPromptLayers,
} from '@nbos/shared';
import { requireAgentName, normalizeAgentDescription } from '../agents/external-agent.rules';

const LAYER_ERRORS: Record<string, string> = {
  PLATFORM_SAFETY_REQUIRED: 'platformSafety is required',
  AGENT_ROLE_REQUIRED: 'agentRole is required',
  LAYER_TOO_LONG: 'A prompt layer exceeds the maximum length',
  LAYERS_TOO_LONG: 'Prompt layers exceed the combined maximum length',
};

export function requirePromptPolicyName(value: string): string {
  return requireAgentName(value);
}

export function normalizePromptPurpose(
  value: string | null | undefined,
): string | null | undefined {
  return normalizeAgentDescription(value);
}

export function requirePromptLayers(input: AiPromptLayers): AiPromptLayers {
  const issue = validatePromptLayers(input);
  if (issue) {
    throw new BadRequestException(LAYER_ERRORS[issue] ?? 'Invalid prompt layers');
  }
  return normalizePromptLayers(input);
}

export function digestPromptLayers(layers: AiPromptLayers): string {
  return createHash('sha256').update(canonicalizePromptLayers(layers), 'utf8').digest('hex');
}

export function toPromptLayerWrite(layers: AiPromptLayers): {
  platformSafety: string;
  agentRole: string;
  domainRules: string | null;
  channelBehavior: string | null;
  contentDigest: string;
} {
  const normalized = requirePromptLayers(layers);
  return {
    platformSafety: normalized.platformSafety,
    agentRole: normalized.agentRole,
    domainRules: normalized.domainRules ?? null,
    channelBehavior: normalized.channelBehavior ?? null,
    contentDigest: digestPromptLayers(normalized),
  };
}
