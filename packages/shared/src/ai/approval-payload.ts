import { jsonContainsSecretShapedFields, redactSecretShapedFields } from './context-classification';
import { AI_APPROVAL_SUMMARY_MAX_CHARS } from './approval-types';

export type AiApprovalPayloadIssue = 'SECRET_FORBIDDEN' | 'PAYLOAD_NOT_OBJECT';

/**
 * Canonical JSON for digest binding. Key order is sorted at every object
 * level so equivalent payloads hash identically.
 */
export function canonicalizeApprovalPayload(payload: Record<string, unknown>): string {
  return JSON.stringify(sortJsonValue(payload));
}

export function isMaterialPayloadChange(
  storedCanonical: string,
  proposedPayload: Record<string, unknown>,
): boolean {
  return canonicalizeApprovalPayload(proposedPayload) !== storedCanonical;
}

export function assertApprovalPayload(
  payload: unknown,
): { ok: true; payload: Record<string, unknown> } | { ok: false; reason: AiApprovalPayloadIssue } {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, reason: 'PAYLOAD_NOT_OBJECT' };
  }
  const record = payload as Record<string, unknown>;
  if (jsonContainsSecretShapedFields(record)) {
    return { ok: false, reason: 'SECRET_FORBIDDEN' };
  }
  return { ok: true, payload: record };
}

/** Approver-visible summary. Secrets are stripped; the digest still binds the full canonical form. */
export function buildSafeApprovalSummary(payload: Record<string, unknown>): string {
  const redacted = redactSecretShapedFields(payload).projection;
  const canonical = canonicalizeApprovalPayload(redacted);
  if (canonical.length <= AI_APPROVAL_SUMMARY_MAX_CHARS) {
    return canonical;
  }
  return `${canonical.slice(0, AI_APPROVAL_SUMMARY_MAX_CHARS)}…`;
}

function sortJsonValue(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }
  const record = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(record).sort()) {
    const child = record[key];
    if (child !== undefined) {
      sorted[key] = sortJsonValue(child);
    }
  }
  return sorted;
}
