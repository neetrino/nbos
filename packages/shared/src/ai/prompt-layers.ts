import {
  PROMPT_LAYER_MAX_CHARS,
  PROMPT_LAYERS_MAX_TOTAL_CHARS,
  type AiPromptLayers,
} from './prompt-policy-types';

export const PROMPT_LAYER_KEYS = [
  'platformSafety',
  'agentRole',
  'domainRules',
  'channelBehavior',
] as const;

export type PromptLayerKey = (typeof PROMPT_LAYER_KEYS)[number];

export type PromptLayerIssue =
  | 'PLATFORM_SAFETY_REQUIRED'
  | 'AGENT_ROLE_REQUIRED'
  | 'LAYER_TOO_LONG'
  | 'LAYERS_TOO_LONG';

function trimLayer(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Canonical layer object used for persistence, digest and equality. */
export function normalizePromptLayers(input: AiPromptLayers): AiPromptLayers {
  return {
    platformSafety: input.platformSafety.trim(),
    agentRole: input.agentRole.trim(),
    domainRules: trimLayer(input.domainRules),
    channelBehavior: trimLayer(input.channelBehavior),
  };
}

export function canonicalizePromptLayers(layers: AiPromptLayers): string {
  const normalized = normalizePromptLayers(layers);
  return JSON.stringify({
    platformSafety: normalized.platformSafety,
    agentRole: normalized.agentRole,
    domainRules: normalized.domainRules,
    channelBehavior: normalized.channelBehavior,
  });
}

export function validatePromptLayers(input: AiPromptLayers): PromptLayerIssue | null {
  const layers = normalizePromptLayers(input);
  if (!layers.platformSafety) {
    return 'PLATFORM_SAFETY_REQUIRED';
  }
  if (!layers.agentRole) {
    return 'AGENT_ROLE_REQUIRED';
  }
  const values = [
    layers.platformSafety,
    layers.agentRole,
    layers.domainRules ?? '',
    layers.channelBehavior ?? '',
  ];
  if (values.some((value) => value.length > PROMPT_LAYER_MAX_CHARS)) {
    return 'LAYER_TOO_LONG';
  }
  const total = values.reduce((sum, value) => sum + value.length, 0);
  if (total > PROMPT_LAYERS_MAX_TOTAL_CHARS) {
    return 'LAYERS_TOO_LONG';
  }
  return null;
}
