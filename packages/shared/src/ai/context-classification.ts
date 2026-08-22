import { isDataClassificationWithin, type AiDataClassification } from './capability-types';
import {
  AI_UNTRUSTED_CONTEXT_SOURCE_TYPES,
  type AiContextSourceType,
  type AiContextTrustLevel,
} from './context-types';

export const AI_CONTEXT_SECRET_FIELD_KEYS = [
  'apikey',
  'api_key',
  'token',
  'accesstoken',
  'refreshtoken',
  'password',
  'secret',
  'privatekey',
  'authorization',
  'bearer',
  'encryptedapikey',
] as const;

const SECRET_KEY_SET = new Set<string>(AI_CONTEXT_SECRET_FIELD_KEYS);
const SECRET_WALK_MAX_DEPTH = 16;

export function isUntrustedContextSource(sourceType: AiContextSourceType): boolean {
  return (AI_UNTRUSTED_CONTEXT_SOURCE_TYPES as readonly string[]).includes(sourceType);
}

export function contextTrustForSource(sourceType: AiContextSourceType): AiContextTrustLevel {
  return isUntrustedContextSource(sourceType) ? 'UNTRUSTED_CONTENT' : 'TRUSTED_CONFIG';
}

export function normalizeContextFieldKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isSecretShapedFieldKey(key: string): boolean {
  const normalized = normalizeContextFieldKey(key);
  if (SECRET_KEY_SET.has(normalized)) {
    return true;
  }
  return AI_CONTEXT_SECRET_FIELD_KEYS.some((secret) => normalized.includes(secret));
}

export function jsonContainsSecretShapedFields(value: unknown, depth = 0): boolean {
  if (depth > SECRET_WALK_MAX_DEPTH) {
    return true;
  }
  if (value === null || value === undefined || typeof value !== 'object') {
    return false;
  }
  if (Array.isArray(value)) {
    return value.some((item) => jsonContainsSecretShapedFields(item, depth + 1));
  }
  return Object.entries(value as Record<string, unknown>).some(
    ([key, child]) =>
      isSecretShapedFieldKey(key) || jsonContainsSecretShapedFields(child, depth + 1),
  );
}

export function projectionContainsSecretFields(projection: Record<string, unknown>): boolean {
  return jsonContainsSecretShapedFields(projection);
}

export function redactSecretShapedFields(projection: Record<string, unknown>): {
  projection: Record<string, unknown>;
  redacted: boolean;
  removedKeys: string[];
} {
  return redactJsonRecord(projection, 0);
}

function redactJsonRecord(
  input: Record<string, unknown>,
  depth: number,
): { projection: Record<string, unknown>; redacted: boolean; removedKeys: string[] } {
  const removedKeys: string[] = [];
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (isSecretShapedFieldKey(key)) {
      removedKeys.push(key);
      continue;
    }
    const child = redactJsonValue(value, depth + 1, key);
    next[key] = child.value;
    removedKeys.push(...child.removedKeys);
  }
  return { projection: next, redacted: removedKeys.length > 0, removedKeys };
}

function redactJsonValue(
  value: unknown,
  depth: number,
  path: string,
): { value: unknown; removedKeys: string[] } {
  if (depth > SECRET_WALK_MAX_DEPTH) {
    return { value: null, removedKeys: [path] };
  }
  if (Array.isArray(value)) {
    return redactJsonArray(value, depth, path);
  }
  if (value !== null && typeof value === 'object') {
    const nested = redactJsonRecord(value as Record<string, unknown>, depth);
    return {
      value: nested.projection,
      removedKeys: nested.removedKeys.map((key) => `${path}.${key}`),
    };
  }
  return { value, removedKeys: [] };
}

function redactJsonArray(
  value: unknown[],
  depth: number,
  path: string,
): { value: unknown; removedKeys: string[] } {
  const removedKeys: string[] = [];
  const next = value.map((item, index) => {
    const child = redactJsonValue(item, depth + 1, `${path}[${index}]`);
    removedKeys.push(...child.removedKeys);
    return child.value;
  });
  return { value: next, removedKeys };
}

export function isClassificationAllowed(
  actual: AiDataClassification,
  allowed: AiDataClassification,
): boolean {
  return isDataClassificationWithin(actual, allowed);
}
