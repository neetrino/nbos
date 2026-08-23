import { projectionContainsSecretFields } from './context-classification';
import type { AiContextProvenance } from './context-types';

export const AI_MEMORY_SCOPE_TYPES = [
  'USER',
  'CUSTOMER',
  'CONVERSATION',
  'WORKSPACE',
  'PROJECT',
  'PRODUCT',
  'INTERNAL_AGENT',
  'ORGANIZATION',
] as const;

export type AiMemoryScopeType = (typeof AI_MEMORY_SCOPE_TYPES)[number];

export const AI_MEMORY_OWNER_TYPES = [
  'USER',
  'CUSTOMER',
  'CONVERSATION',
  'WORKSPACE',
  'PROJECT',
  'PRODUCT',
  'INTERNAL_AGENT',
  'ORGANIZATION',
] as const;

export type AiMemoryOwnerType = (typeof AI_MEMORY_OWNER_TYPES)[number];

export const AI_PERSISTENT_MEMORY_DEFAULT_ENABLED = false;

export interface AiPersistentMemoryRecord {
  ownerType: AiMemoryOwnerType;
  ownerId: string;
  scopeType: AiMemoryScopeType;
  scopeId: string;
  purpose: string;
  retention: { policy: string; expiresAt?: string | null };
  provenance: AiContextProvenance;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AiPersistentMemoryWriteInput {
  enabled?: boolean;
  ownerType: string;
  ownerId: string;
  scopeType: string;
  scopeId: string;
  purpose: string;
  retention: { policy: string; expiresAt?: string | null };
  provenance: AiContextProvenance;
  payload: Record<string, unknown>;
}

export type AiMemoryWriteDenial = 'MEMORY_DISABLED' | 'SECRET_FORBIDDEN' | 'CONTRACT_INCOMPLETE';

export type AiMemoryWriteResult = { ok: true } | { ok: false; reason: AiMemoryWriteDenial };

export function isAiMemoryScopeType(value: string): value is AiMemoryScopeType {
  return (AI_MEMORY_SCOPE_TYPES as readonly string[]).includes(value);
}

export function isAiMemoryOwnerType(value: string): value is AiMemoryOwnerType {
  return (AI_MEMORY_OWNER_TYPES as readonly string[]).includes(value);
}

export function evaluatePersistentMemoryWrite(
  input: AiPersistentMemoryWriteInput,
): AiMemoryWriteResult {
  if (!hasCompleteMemoryContract(input)) {
    return { ok: false, reason: 'CONTRACT_INCOMPLETE' };
  }
  if (projectionContainsSecretFields(input.payload)) {
    return { ok: false, reason: 'SECRET_FORBIDDEN' };
  }
  if (input.enabled !== true) {
    return { ok: false, reason: 'MEMORY_DISABLED' };
  }
  return { ok: true };
}

export interface AiPersistentMemoryStore {
  isEnabled(): boolean;
  read(): Promise<AiPersistentMemoryRecord[]>;
  write(input: AiPersistentMemoryWriteInput): Promise<AiMemoryWriteResult>;
}

/** Phase 1 default: interface exists, runtime stays off. */
export function createDisabledPersistentMemoryStore(): AiPersistentMemoryStore {
  return {
    isEnabled: () => AI_PERSISTENT_MEMORY_DEFAULT_ENABLED,
    read: async () => [],
    write: async (input) => evaluatePersistentMemoryWrite({ ...input, enabled: false }),
  };
}

function hasCompleteMemoryContract(input: AiPersistentMemoryWriteInput): boolean {
  return (
    isAiMemoryOwnerType(input.ownerType) &&
    input.ownerId.trim().length > 0 &&
    isAiMemoryScopeType(input.scopeType) &&
    input.scopeId.trim().length > 0 &&
    input.purpose.trim().length > 0 &&
    input.retention.policy.trim().length > 0 &&
    Boolean(input.provenance.sourceId)
  );
}
