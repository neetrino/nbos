import { getAiCapability, type AiCapabilityDefinition } from '@nbos/shared';
import { AgentAccessException } from '../auth/agent-auth.errors';
import {
  AGENT_LIST_DEFAULT_PAGE_SIZE,
  AGENT_LIST_MAX_PAGE_SIZE,
  AGENT_LIST_MIN_PAGE_SIZE,
} from './agent-capability.constants';

const PROTOCOL_FIELDS = new Set(['idempotencyKey', 'clientOperationId']);

export function requireCapability(key: string): AiCapabilityDefinition {
  const capability = getAiCapability(key);
  if (!capability) {
    throw AgentAccessException.fromDenyReason('CAPABILITY_UNKNOWN');
  }
  return capability;
}

/**
 * Rejects unknown JSON fields. Catalog `input.fields` is the allowlist.
 * Protocol-level keys are stripped rather than rejected.
 */
export function pickCapabilityInput(
  capability: AiCapabilityDefinition,
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const allowed = new Set(capability.input.fields);
  const picked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (PROTOCOL_FIELDS.has(key)) continue;
    if (!allowed.has(key)) {
      throw AgentAccessException.validationFailed(`Unknown field: ${key}`);
    }
    if (value !== undefined) {
      picked[key] = value;
    }
  }
  return picked;
}

export function readRequiredString(input: Record<string, unknown>, field: string): string {
  const value = input[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw AgentAccessException.validationFailed(`${field} is required`);
  }
  return value.trim();
}

export function readOptionalString(
  input: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = input[field];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw AgentAccessException.validationFailed(`${field} must be a string`);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function readOptionalNullableString(
  input: Record<string, unknown>,
  field: string,
): string | null | undefined {
  const value = input[field];
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw AgentAccessException.validationFailed(`${field} must be a string or null`);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function readPage(input: Record<string, unknown>): number {
  return clampPage(readOptionalPositiveInt(input, 'page'));
}

export function readPageSize(input: Record<string, unknown>): number {
  return clampPageSize(readOptionalPositiveInt(input, 'pageSize'));
}

function readOptionalPositiveInt(
  input: Record<string, unknown>,
  field: string,
): number | undefined {
  const value = input[field];
  if (value === undefined || value === null) return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw AgentAccessException.validationFailed(`${field} must be a positive integer`);
  }
  return Math.floor(parsed);
}

function clampPage(page: number | undefined): number {
  if (page === undefined) return 1;
  return Math.max(1, page);
}

function clampPageSize(pageSize: number | undefined): number {
  if (pageSize === undefined) return AGENT_LIST_DEFAULT_PAGE_SIZE;
  return Math.min(AGENT_LIST_MAX_PAGE_SIZE, Math.max(AGENT_LIST_MIN_PAGE_SIZE, pageSize));
}
