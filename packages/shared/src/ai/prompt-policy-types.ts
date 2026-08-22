export const AI_PROMPT_POLICY_STATUSES = ['DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED'] as const;

export type AiPromptPolicyStatus = (typeof AI_PROMPT_POLICY_STATUSES)[number];

export const AI_PROMPT_VERSION_STATUSES = ['DRAFT', 'TESTING', 'PUBLISHED', 'RETIRED'] as const;

export type AiPromptVersionStatus = (typeof AI_PROMPT_VERSION_STATUSES)[number];

export const AI_PROMPT_EDITABLE_VERSION_STATUSES = [
  'DRAFT',
] as const satisfies readonly AiPromptVersionStatus[];

export function isAiPromptPolicyStatus(value: string): value is AiPromptPolicyStatus {
  return (AI_PROMPT_POLICY_STATUSES as readonly string[]).includes(value);
}

export function isAiPromptVersionStatus(value: string): value is AiPromptVersionStatus {
  return (AI_PROMPT_VERSION_STATUSES as readonly string[]).includes(value);
}

export function isEditablePromptVersionStatus(status: AiPromptVersionStatus): boolean {
  return status === 'DRAFT';
}

/** Production assignment and Internal Agent execution use only PUBLISHED. */
export function isProductionPromptVersionStatus(status: AiPromptVersionStatus): boolean {
  return status === 'PUBLISHED';
}

export const PROMPT_LAYER_MAX_CHARS = 8_000;
export const PROMPT_LAYERS_MAX_TOTAL_CHARS = 24_000;

export interface AiPromptLayers {
  platformSafety: string;
  agentRole: string;
  domainRules?: string | null;
  channelBehavior?: string | null;
}

/** Execution attribution only — never the instruction text. */
export interface AiPromptVersionAttribution {
  promptPolicyId: string;
  promptVersionId: string;
  version: number;
  contentDigest: string;
  status: AiPromptVersionStatus;
}
