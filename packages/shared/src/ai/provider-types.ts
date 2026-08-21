export const AI_PROVIDER_TYPES = ['OPENAI', 'ANTHROPIC'] as const;

export type AiProviderType = (typeof AI_PROVIDER_TYPES)[number];

export const AI_PROVIDER_CONNECTION_STATUSES = ['ACTIVE', 'DISABLED', 'REVOKED'] as const;

export type AiProviderConnectionStatus = (typeof AI_PROVIDER_CONNECTION_STATUSES)[number];

export const AI_MODEL_STATUSES = [
  'DISCOVERED',
  'ACTIVE',
  'DISABLED',
  'DEPRECATED',
  'UNAVAILABLE',
] as const;

export type AiModelStatus = (typeof AI_MODEL_STATUSES)[number];

/** Models that may be assigned to a production Model Policy candidate. */
export const AI_MODEL_PRODUCTION_STATUSES = ['ACTIVE'] as const satisfies readonly AiModelStatus[];

export type AiModelProductionStatus = (typeof AI_MODEL_PRODUCTION_STATUSES)[number];

export function isAiProviderType(value: string): value is AiProviderType {
  return (AI_PROVIDER_TYPES as readonly string[]).includes(value);
}

export function isAiModelStatus(value: string): value is AiModelStatus {
  return (AI_MODEL_STATUSES as readonly string[]).includes(value);
}

export function isProductionAssignableModelStatus(status: AiModelStatus): boolean {
  return (AI_MODEL_PRODUCTION_STATUSES as readonly AiModelStatus[]).includes(status);
}
