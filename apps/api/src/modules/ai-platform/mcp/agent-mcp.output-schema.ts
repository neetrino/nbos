import { getAiCapability } from '@nbos/shared';
import type {
  AgentOperationDefinition,
  AgentOperationId,
} from '../protocol/agent-operation.registry';

/** Operations whose handlers return the `09` `{ items, meta }` page. */
const LIST_ENVELOPE_OPERATION_IDS = new Set<AgentOperationId>([
  'workspaces.list',
  'tasks.list',
  'tasks.discussion',
]);

/**
 * Catalog output descriptor as a closed JSON schema.
 * List operations advertise `items` / `meta`; others only item fields.
 */
export function buildOutputSchema(operation: AgentOperationDefinition):
  | {
      type: 'object';
      properties: Record<string, { type: string; description: string }>;
      additionalProperties: false;
    }
  | undefined {
  if (!operation.capabilityKey) return undefined;
  const capability = getAiCapability(operation.capabilityKey);
  if (!capability) return undefined;
  const properties: Record<string, { type: string; description: string }> = {};
  for (const field of capability.output.fields) {
    properties[field] = { type: 'string', description: field };
  }
  if (LIST_ENVELOPE_OPERATION_IDS.has(operation.id)) {
    properties.items = { type: 'array', description: 'Page of projected items.' };
    properties.meta = {
      type: 'object',
      description: 'Pagination metadata (page, pageSize, total).',
    };
  }
  return { type: 'object', properties, additionalProperties: false };
}
