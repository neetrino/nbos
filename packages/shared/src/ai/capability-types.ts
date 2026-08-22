/**
 * Capability contract shared by External Agent REST, MCP and future Internal AI
 * tool adapters. One registry, one vocabulary — protocol adapters never define
 * their own permissions.
 */

/** Mirrors Prisma `AgentScopeTypeEnum`. */
export const AI_SCOPE_TYPES = [
  'ORGANIZATION',
  'PROJECT',
  'PRODUCT',
  'WORKSPACE',
  'RESOURCE',
] as const;

export type AiScopeType = (typeof AI_SCOPE_TYPES)[number];

export const AI_ACCESS_KINDS = ['READ', 'WRITE'] as const;

export type AiAccessKind = (typeof AI_ACCESS_KINDS)[number];

export const AI_RISK_CLASSES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export type AiRiskClass = (typeof AI_RISK_CLASSES)[number];

export const AI_APPROVAL_REQUIREMENTS = ['NONE', 'REQUIRED'] as const;

export type AiApprovalRequirement = (typeof AI_APPROVAL_REQUIREMENTS)[number];

/**
 * Generic AI data-sensitivity ladder. Module-specific vocabularies (for example
 * Drive `FileConfidentialityEnum`) map onto this in their own module code.
 */
export const AI_DATA_CLASSIFICATIONS = ['INTERNAL', 'SENSITIVE', 'SECRET'] as const;

export type AiDataClassification = (typeof AI_DATA_CLASSIFICATIONS)[number];

const DATA_CLASSIFICATION_RANK: Record<AiDataClassification, number> = {
  INTERNAL: 0,
  SENSITIVE: 1,
  SECRET: 2,
};

/** True when `actual` is no more sensitive than `allowed`. */
export function isDataClassificationWithin(
  actual: AiDataClassification,
  allowed: AiDataClassification,
): boolean {
  return DATA_CLASSIFICATION_RANK[actual] <= DATA_CLASSIFICATION_RANK[allowed];
}

export const AI_RATE_LIMIT_CLASSES = [
  'READ_STANDARD',
  'WRITE_STANDARD',
  'WRITE_SENSITIVE',
] as const;

export type AiRateLimitClass = (typeof AI_RATE_LIMIT_CLASSES)[number];

export const AI_IDEMPOTENCY_REQUIREMENTS = ['NOT_REQUIRED', 'REQUIRED'] as const;

export type AiIdempotencyRequirement = (typeof AI_IDEMPOTENCY_REQUIREMENTS)[number];

export const AI_AUDIT_BEHAVIORS = ['ON_DENY', 'ALWAYS'] as const;

export type AiAuditBehavior = (typeof AI_AUDIT_BEHAVIORS)[number];

/**
 * Stable contract descriptor. Protocol adapters bind a concrete validator or
 * projection to `id`; the field allowlist is the authoritative boundary.
 */
export interface AiCapabilitySchemaDescriptor {
  id: string;
  fields: readonly string[];
}

export interface AiCapabilityDefinition {
  key: string;
  version: number;
  module: string;
  description: string;
  access: AiAccessKind;
  risk: AiRiskClass;
  allowedScopeTypes: readonly AiScopeType[];
  input: AiCapabilitySchemaDescriptor;
  output: AiCapabilitySchemaDescriptor;
  idempotency: AiIdempotencyRequirement;
  audit: AiAuditBehavior;
  approval: AiApprovalRequirement;
  rateLimitClass: AiRateLimitClass;
  /** Most sensitive data this capability may ever touch. */
  maxDataClassification: AiDataClassification;
  /**
   * True when the target's own classification must be supplied for the decision
   * to be safe — a file or a discussion carries confidentiality the capability
   * cannot infer. The evaluator denies such calls when it is missing, because a
   * ceiling cannot be enforced against an unknown value.
   */
  requiresTargetDataClassification: boolean;
  deprecated: boolean;
}

const CAPABILITY_KEY_PATTERN = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/** Stable key format: `<module>.<action>`, lowercase snake_case. */
export function isValidCapabilityKeyFormat(key: string): boolean {
  return CAPABILITY_KEY_PATTERN.test(key);
}
