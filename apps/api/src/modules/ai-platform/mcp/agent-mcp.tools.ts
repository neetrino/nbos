import { getAiCapability } from '@nbos/shared';
import { AGENT_ARTIFACT_MAX_BYTES } from '../protocol/agent-artifact-content';
import {
  agentOperationRequiresIdempotency,
  listAgentOperations,
  type AgentOperationDefinition,
} from '../protocol/agent-operation.registry';
import {
  AGENT_LIST_MAX_PAGE_SIZE,
  AGENT_LIST_MIN_PAGE_SIZE,
  AGENT_TASK_PRIORITIES,
  AGENT_TASK_SORT_FIELDS,
  AGENT_TASK_STATUSES,
} from '../gateway/agent-capability.constants';

export const MCP_CONTENT_FIELD = 'contentBase64';
export const MCP_OPERATION_ID_FIELD = 'clientOperationId';

export interface McpJsonSchema {
  type: 'object';
  properties: Record<string, McpSchemaProperty>;
  required?: string[];
  additionalProperties: false;
}

export interface McpSchemaProperty {
  type: string;
  description: string;
  enum?: readonly string[];
  minimum?: number;
  maximum?: number;
}

export interface McpToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: McpJsonSchema;
}

/**
 * Field vocabulary shared by every tool.
 *
 * Schemas are advisory for the client; the authoritative check stays in the
 * gateway, which validates the same names and enums server-side. Publishing
 * them here only makes a well-behaved client fail earlier.
 */
const FIELD_SCHEMAS: Record<string, McpSchemaProperty> = {
  workspaceId: { type: 'string', description: 'NBOS Work Space id.' },
  taskId: { type: 'string', description: 'NBOS Task id.' },
  fileAssetId: { type: 'string', description: 'Drive file asset id linked to the task.' },
  page: { type: 'integer', description: 'Page number, 1-based.', minimum: 1 },
  pageSize: {
    type: 'integer',
    description: 'Items per page.',
    minimum: AGENT_LIST_MIN_PAGE_SIZE,
    maximum: AGENT_LIST_MAX_PAGE_SIZE,
  },
  status: { type: 'string', description: 'Task status filter.', enum: AGENT_TASK_STATUSES },
  sortBy: { type: 'string', description: 'Sort field.', enum: AGENT_TASK_SORT_FIELDS },
  title: { type: 'string', description: 'Task title.' },
  description: { type: 'string', description: 'Task description.' },
  priority: { type: 'string', description: 'Task priority.', enum: AGENT_TASK_PRIORITIES },
  dueDate: { type: 'string', description: 'Due date as an ISO-8601 date.' },
  expectedUpdatedAt: {
    type: 'string',
    description: 'Optimistic lock: the task updatedAt value this change is based on.',
  },
  body: { type: 'string', description: 'Comment text attributed to this agent.' },
  fileName: { type: 'string', description: 'Artifact file name.' },
  mimeType: { type: 'string', description: 'Artifact MIME type.' },
  sizeBytes: { type: 'integer', description: 'Artifact size in bytes.', minimum: 0 },
};

/** Requiredness is a protocol contract; the catalog only lists field names. */
const REQUIRED_FIELDS: Record<string, readonly string[]> = {
  nbos_get_identity: [],
  nbos_list_workspaces: [],
  nbos_get_workspace: ['workspaceId'],
  nbos_list_tasks: ['workspaceId'],
  nbos_get_task: ['taskId'],
  nbos_create_task: ['workspaceId', 'title'],
  nbos_update_task: ['taskId', 'expectedUpdatedAt'],
  nbos_start_task: ['taskId'],
  nbos_get_task_discussion: ['taskId'],
  nbos_add_task_comment: ['taskId', 'body'],
  nbos_list_task_artifacts: ['taskId'],
  nbos_get_task_artifact: ['taskId', 'fileAssetId'],
  nbos_attach_task_artifact: ['taskId', 'fileName', 'mimeType', 'sizeBytes', MCP_CONTENT_FIELD],
  nbos_submit_task_review: ['taskId'],
};

const TOOL_TITLES: Record<string, string> = {
  nbos_get_identity: 'Get NBOS agent identity',
  nbos_list_workspaces: 'List NBOS Work Spaces',
  nbos_get_workspace: 'Get NBOS Work Space',
  nbos_list_tasks: 'List NBOS tasks',
  nbos_get_task: 'Get NBOS task',
  nbos_create_task: 'Create NBOS task',
  nbos_update_task: 'Update NBOS task fields',
  nbos_start_task: 'Start NBOS task',
  nbos_get_task_discussion: 'Read NBOS task discussion',
  nbos_add_task_comment: 'Comment on NBOS task',
  nbos_list_task_artifacts: 'List NBOS task artifacts',
  nbos_get_task_artifact: 'Get NBOS task artifact',
  nbos_attach_task_artifact: 'Attach NBOS task artifact',
  nbos_submit_task_review: 'Submit NBOS task for review',
};

const IDENTITY_DESCRIPTION =
  'Return the identity of the calling NBOS agent. Does not list capabilities.';

/**
 * The published Phase 1 tool set.
 *
 * There is no delete tool, no status-assignment tool and no credentials tool,
 * because there is no such capability to map one onto. The list is generated
 * from the shared operation registry, so a tool cannot exist without a REST
 * sibling and the same capability behind it.
 */
export function listAgentMcpTools(): McpToolDefinition[] {
  return listAgentOperations().map(toToolDefinition);
}

function toToolDefinition(operation: AgentOperationDefinition): McpToolDefinition {
  return {
    name: operation.mcpTool,
    title: TOOL_TITLES[operation.mcpTool] ?? operation.mcpTool,
    description: describe(operation),
    inputSchema: buildInputSchema(operation),
  };
}

function describe(operation: AgentOperationDefinition): string {
  if (!operation.capabilityKey) return IDENTITY_DESCRIPTION;
  const capability = getAiCapability(operation.capabilityKey);
  return capability?.description ?? operation.id;
}

function buildInputSchema(operation: AgentOperationDefinition): McpJsonSchema {
  const properties: Record<string, McpSchemaProperty> = {};
  for (const field of capabilityFields(operation)) {
    const schema = FIELD_SCHEMAS[field];
    if (schema) {
      properties[field] = schema;
    }
  }
  if (operation.acceptsBinaryContent) {
    properties[MCP_CONTENT_FIELD] = {
      type: 'string',
      description: `Base64-encoded file content, at most ${AGENT_ARTIFACT_MAX_BYTES} bytes decoded.`,
    };
  }
  if (agentOperationRequiresIdempotency(operation)) {
    properties[MCP_OPERATION_ID_FIELD] = {
      type: 'string',
      description: 'Stable client operation id. A safe retry returns the original result.',
    };
  }
  return withRequired(operation, properties);
}

function capabilityFields(operation: AgentOperationDefinition): readonly string[] {
  if (!operation.capabilityKey) return [];
  return getAiCapability(operation.capabilityKey)?.input.fields ?? [];
}

function withRequired(
  operation: AgentOperationDefinition,
  properties: Record<string, McpSchemaProperty>,
): McpJsonSchema {
  const required = [...(REQUIRED_FIELDS[operation.mcpTool] ?? [])];
  if (agentOperationRequiresIdempotency(operation)) {
    required.push(MCP_OPERATION_ID_FIELD);
  }
  const schema: McpJsonSchema = { type: 'object', properties, additionalProperties: false };
  if (required.length > 0) {
    schema.required = required;
  }
  return schema;
}
