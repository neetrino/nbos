import type { AiCapabilityDefinition } from './capability-types';

/** Live External Agent list handlers return `{ items, meta }` (`09` envelope). */
export const AI_OUTPUT_ENVELOPE_FIELDS = ['items', 'meta'] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function pickDeclaredFields(
  value: Record<string, unknown>,
  fields: readonly string[],
): Record<string, unknown> {
  const projected: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in value) {
      projected[field] = value[field];
    }
  }
  return projected;
}

function projectItem(value: unknown, fields: readonly string[]): unknown {
  if (!isPlainObject(value)) {
    return value;
  }
  return pickDeclaredFields(value, fields);
}

/**
 * Projects a capability result onto the catalog output descriptor.
 * Extra top-level keys are stripped. List envelopes keep `items` / `meta`.
 */
export function projectCapabilityOutput(
  capability: AiCapabilityDefinition,
  data: unknown,
): unknown {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => projectItem(item, capability.output.fields));
  }
  if (!isPlainObject(data)) {
    throw new Error(`Capability ${capability.key} returned a non-object projection`);
  }
  if (Array.isArray(data.items)) {
    const projected: Record<string, unknown> = {
      items: data.items.map((item) => projectItem(item, capability.output.fields)),
    };
    if ('meta' in data) {
      projected.meta = data.meta;
    }
    return projected;
  }
  return pickDeclaredFields(data, capability.output.fields);
}
