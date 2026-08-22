import type { ActorChannelSource, ActorType } from '../actor/actor-types';
import type { AiDataClassification } from './capability-types';
import type { AiPolicyDecision } from './policy-decision';

export const AI_CONTEXT_SOURCE_TYPES = [
  'PROMPT_POLICY',
  'AGENT_CONFIG',
  'SYSTEM',
  'SESSION',
  'TASK',
  'TASK_DISCUSSION',
  'WORKSPACE',
  'DRIVE_FILE',
  'DOCUMENT',
  'MESSAGE',
  'EMAIL',
  'USER_REQUEST',
  'MEMORY',
  'KNOWLEDGE',
] as const;

export type AiContextSourceType = (typeof AI_CONTEXT_SOURCE_TYPES)[number];

export const AI_CONTEXT_TRUST_LEVELS = ['TRUSTED_CONFIG', 'UNTRUSTED_CONTENT'] as const;

export type AiContextTrustLevel = (typeof AI_CONTEXT_TRUST_LEVELS)[number];

export const AI_UNTRUSTED_CONTEXT_SOURCE_TYPES = [
  'TASK',
  'TASK_DISCUSSION',
  'DRIVE_FILE',
  'DOCUMENT',
  'MESSAGE',
  'EMAIL',
  'USER_REQUEST',
  'KNOWLEDGE',
  'MEMORY',
] as const satisfies readonly AiContextSourceType[];

export type AiUntrustedContextSourceType = (typeof AI_UNTRUSTED_CONTEXT_SOURCE_TYPES)[number];

export const AI_CONTEXT_OMIT_REASONS = [
  'UNAUTHORIZED',
  'CLASSIFICATION',
  'SECRET',
  'BUDGET',
] as const;

export type AiContextOmitReason = (typeof AI_CONTEXT_OMIT_REASONS)[number];

export const AI_CONTEXT_DEFAULT_MAX_FRAGMENTS = 16;
export const AI_CONTEXT_DEFAULT_MAX_CHARS = 12_000;
export const AI_CONTEXT_DEFAULT_MAX_AGE_MS = 6 * 60 * 60 * 1_000;

export interface AiContextAccessBasis {
  actorId: string;
  actorType: ActorType;
  capabilityKey: string;
  scopeType?: string;
  scopeId?: string;
  resourceType?: string | null;
  resourceId?: string | null;
}

export interface AiContextProvenance {
  sourceType: AiContextSourceType;
  sourceId: string;
  retrievedAt: string;
  accessBasis: AiContextAccessBasis;
  citation?: { label: string; uri?: string };
}

export interface AiContextFreshness {
  sourceUpdatedAt: string | null;
  retrievedAt: string;
  maxAgeMs: number | null;
  stale: boolean;
}

export interface AiContextClassificationMeta {
  dataClassification: AiDataClassification;
  redacted: boolean;
  redactionReason?: 'SECRET' | 'CLASSIFICATION_CEILING' | 'FIELD_ALLOWLIST';
  trust: AiContextTrustLevel;
}

export interface AiContextBudget {
  maxFragments: number;
  maxChars: number;
  maxAgeMs?: number;
}

export interface AiAuthorizedContextSource {
  sourceType: AiContextSourceType;
  sourceId: string;
  /** Purpose-built projection. Never a raw ORM row. */
  projection: Record<string, unknown>;
  sourceUpdatedAt?: string | null;
  classification: AiDataClassification;
  accessBasis: Pick<
    AiContextAccessBasis,
    'capabilityKey' | 'scopeType' | 'scopeId' | 'resourceType' | 'resourceId'
  >;
  citation?: { label: string; uri?: string };
}

export interface AiContextFragment {
  sourceType: AiContextSourceType;
  sourceId: string;
  projection: Record<string, unknown>;
  provenance: AiContextProvenance;
  freshness: AiContextFreshness;
  classification: AiContextClassificationMeta;
}

export interface AiAssembledContext {
  fragments: AiContextFragment[];
  omitted: Array<{
    sourceId: string;
    sourceType: AiContextSourceType;
    reason: AiContextOmitReason;
  }>;
  budget: { usedFragments: number; usedChars: number; maxChars: number; truncated: boolean };
}

export interface AiContextAssembleRequest {
  actorId: string;
  actorType: ActorType;
  channel?: ActorChannelSource;
  authorization: AiPolicyDecision;
  sources: readonly AiAuthorizedContextSource[];
  budget?: Partial<AiContextBudget>;
  maxDataClassification: AiDataClassification;
  now?: Date;
}
