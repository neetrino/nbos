import { AI_READ_CAPABILITIES } from './capability-catalog.read';
import { AI_WRITE_CAPABILITIES } from './capability-catalog.write';
import {
  isValidCapabilityKeyFormat,
  type AiCapabilityDefinition,
  type AiScopeType,
} from './capability-types';

const PHASE_1_CAPABILITIES: readonly AiCapabilityDefinition[] = [
  ...AI_READ_CAPABILITIES,
  ...AI_WRITE_CAPABILITIES,
];

/**
 * Capabilities that must never be grantable to an External Agent in Phase 1.
 * Asserted by registry tests; deny-by-default lookup already rejects them.
 */
export const AI_CAPABILITIES_FORBIDDEN_PHASE_1 = [
  'tasks.delete',
  'tasks.set_status',
  'tasks.force_complete',
  'credentials.read_secret',
] as const;

const CAPABILITY_INDEX: ReadonlyMap<string, AiCapabilityDefinition> = new Map(
  PHASE_1_CAPABILITIES.map((capability) => [capability.key, capability]),
);

export function listAiCapabilities(): readonly AiCapabilityDefinition[] {
  return PHASE_1_CAPABILITIES;
}

export function isAiCapabilityKey(key: string): boolean {
  return CAPABILITY_INDEX.has(key);
}

/** Returns null for unknown keys. An unknown capability can never be granted. */
export function getAiCapability(key: string): AiCapabilityDefinition | null {
  return CAPABILITY_INDEX.get(key) ?? null;
}

export function isScopeTypeAllowedForCapability(
  capability: AiCapabilityDefinition,
  scopeType: AiScopeType,
): boolean {
  return capability.allowedScopeTypes.includes(scopeType);
}

/** Registry integrity guard used by tests. */
export function findInvalidCapabilityKeys(): readonly string[] {
  return PHASE_1_CAPABILITIES.map((capability) => capability.key).filter(
    (key) => !isValidCapabilityKeyFormat(key),
  );
}
