import type { InputJsonValue } from '@nbos/database';

export const AUDIT_REDACTED_VALUE = '[REDACTED]';

const SENSITIVE_KEY_PATTERN =
  /^(authorization|accessToken|refreshToken|apiKey|api_key|password|passphrase|secret|privateKey|private_key|bearer|token|encryptionKey|providerKey|agentToken)$/i;

const SENSITIVE_CONTENT_KEY_PATTERN =
  /^(prompt|systemPrompt|messages|contextText|inputMessages|completion)$/i;

const MAX_REDACT_DEPTH = 6;

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key) || SENSITIVE_CONTENT_KEY_PATTERN.test(key);
}

function redactUnknown(value: unknown, depth: number): unknown {
  if (depth > MAX_REDACT_DEPTH || value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      item !== null && typeof item === 'object' ? redactUnknown(item, depth + 1) : item,
    );
  }
  if (typeof value !== 'object') {
    return value;
  }

  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    output[key] = isSensitiveKey(key) ? AUDIT_REDACTED_VALUE : redactUnknown(nested, depth + 1);
  }
  return output;
}

/** Strip secrets, tokens, and full prompt/context dumps from Audit changes. */
export function redactAuditChanges(
  changes: InputJsonValue | undefined,
): InputJsonValue | undefined {
  if (changes === undefined) {
    return undefined;
  }
  return redactUnknown(changes, 0) as InputJsonValue;
}
