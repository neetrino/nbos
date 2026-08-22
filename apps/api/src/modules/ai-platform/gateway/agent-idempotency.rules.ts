import { createHash } from 'node:crypto';
import {
  AGENT_IDEMPOTENCY_KEY_MAX_LENGTH,
  AGENT_IDEMPOTENCY_KEY_PATTERN,
} from './agent-capability.constants';
import { AgentAccessException } from '../auth/agent-auth.errors';

export function requireIdempotencyKey(raw: string | null | undefined): string {
  const key = raw?.trim() ?? '';
  if (!key) {
    throw AgentAccessException.validationFailed('Idempotency-Key is required');
  }
  if (key.length > AGENT_IDEMPOTENCY_KEY_MAX_LENGTH) {
    throw AgentAccessException.validationFailed('Idempotency-Key is too long');
  }
  if (!AGENT_IDEMPOTENCY_KEY_PATTERN.test(key)) {
    throw AgentAccessException.validationFailed('Idempotency-Key format is invalid');
  }
  return key;
}

export function fingerprintCapabilityRequest(
  input: Record<string, unknown>,
  payloadBytes?: Uint8Array | null,
): string {
  const hash = createHash('sha256');
  hash.update(stableStringify(input));
  if (payloadBytes && payloadBytes.byteLength > 0) {
    hash.update(Buffer.from(payloadBytes));
  }
  return hash.digest('hex');
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}
