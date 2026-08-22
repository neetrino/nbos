import { getAiCapability } from '@nbos/shared';

/**
 * Single source of truth for the Phase 1 External Agent protocol surface.
 *
 * REST and MCP are two adapters over the same operations. Both read this
 * registry so that a capability, an idempotency requirement or a new operation
 * cannot be added to one protocol and silently forgotten in the other
 * (`09-External-Agent-API-and-MCP-Contract.md` §13, §17).
 */
export const AGENT_OPERATION_IDS = [
  'identity.read',
  'workspaces.list',
  'workspaces.get',
  'tasks.list',
  'tasks.get',
  'tasks.create',
  'tasks.update',
  'tasks.start',
  'tasks.discussion',
  'tasks.comment',
  'tasks.submitReview',
  'artifacts.list',
  'artifacts.get',
  'artifacts.attach',
] as const;

export type AgentOperationId = (typeof AGENT_OPERATION_IDS)[number];

export interface AgentOperationDefinition {
  readonly id: AgentOperationId;
  /**
   * `null` only for identity, which reads the already-authenticated actor and
   * touches no domain data. Every other operation goes through the gateway.
   */
  readonly capabilityKey: string | null;
  readonly mcpTool: string;
  /** Documentation and parity assertions only; Nest owns the real routing. */
  readonly restRoute: string;
  /** Binary bytes travel in `invocation.payload`, never as a JSON input field. */
  readonly acceptsBinaryContent: boolean;
}

export const AGENT_OPERATIONS: Readonly<Record<AgentOperationId, AgentOperationDefinition>> = {
  'identity.read': {
    id: 'identity.read',
    capabilityKey: null,
    mcpTool: 'nbos_get_identity',
    restRoute: 'GET /v1/agent/me',
    acceptsBinaryContent: false,
  },
  'workspaces.list': {
    id: 'workspaces.list',
    capabilityKey: 'workspaces.read',
    mcpTool: 'nbos_list_workspaces',
    restRoute: 'GET /v1/agent/workspaces',
    acceptsBinaryContent: false,
  },
  'workspaces.get': {
    id: 'workspaces.get',
    capabilityKey: 'workspaces.read',
    mcpTool: 'nbos_get_workspace',
    restRoute: 'GET /v1/agent/workspaces/:workspaceId',
    acceptsBinaryContent: false,
  },
  'tasks.list': {
    id: 'tasks.list',
    capabilityKey: 'tasks.list',
    mcpTool: 'nbos_list_tasks',
    restRoute: 'GET /v1/agent/workspaces/:workspaceId/tasks',
    acceptsBinaryContent: false,
  },
  'tasks.get': {
    id: 'tasks.get',
    capabilityKey: 'tasks.read',
    mcpTool: 'nbos_get_task',
    restRoute: 'GET /v1/agent/tasks/:taskId',
    acceptsBinaryContent: false,
  },
  'tasks.create': {
    id: 'tasks.create',
    capabilityKey: 'tasks.create',
    mcpTool: 'nbos_create_task',
    restRoute: 'POST /v1/agent/workspaces/:workspaceId/tasks',
    acceptsBinaryContent: false,
  },
  'tasks.update': {
    id: 'tasks.update',
    capabilityKey: 'tasks.update',
    mcpTool: 'nbos_update_task',
    restRoute: 'PATCH /v1/agent/tasks/:taskId',
    acceptsBinaryContent: false,
  },
  'tasks.start': {
    id: 'tasks.start',
    capabilityKey: 'tasks.start',
    mcpTool: 'nbos_start_task',
    restRoute: 'POST /v1/agent/tasks/:taskId/start',
    acceptsBinaryContent: false,
  },
  'tasks.discussion': {
    id: 'tasks.discussion',
    capabilityKey: 'tasks.read_discussion',
    mcpTool: 'nbos_get_task_discussion',
    restRoute: 'GET /v1/agent/tasks/:taskId/discussion',
    acceptsBinaryContent: false,
  },
  'tasks.comment': {
    id: 'tasks.comment',
    capabilityKey: 'tasks.comment',
    mcpTool: 'nbos_add_task_comment',
    restRoute: 'POST /v1/agent/tasks/:taskId/comments',
    acceptsBinaryContent: false,
  },
  'tasks.submitReview': {
    id: 'tasks.submitReview',
    capabilityKey: 'tasks.submit_review',
    mcpTool: 'nbos_submit_task_review',
    restRoute: 'POST /v1/agent/tasks/:taskId/submit-review',
    acceptsBinaryContent: false,
  },
  'artifacts.list': {
    id: 'artifacts.list',
    capabilityKey: 'drive.read_task_artifact',
    mcpTool: 'nbos_list_task_artifacts',
    restRoute: 'GET /v1/agent/tasks/:taskId/artifacts',
    acceptsBinaryContent: false,
  },
  'artifacts.get': {
    id: 'artifacts.get',
    capabilityKey: 'drive.read_task_artifact',
    mcpTool: 'nbos_get_task_artifact',
    restRoute: 'GET /v1/agent/tasks/:taskId/artifacts/:fileAssetId',
    acceptsBinaryContent: false,
  },
  'artifacts.attach': {
    id: 'artifacts.attach',
    capabilityKey: 'tasks.attach_artifact',
    mcpTool: 'nbos_attach_task_artifact',
    restRoute: 'POST /v1/agent/tasks/:taskId/artifacts',
    acceptsBinaryContent: true,
  },
};

export function listAgentOperations(): readonly AgentOperationDefinition[] {
  return AGENT_OPERATION_IDS.map((id) => AGENT_OPERATIONS[id]);
}

export function getAgentOperation(id: AgentOperationId): AgentOperationDefinition {
  return AGENT_OPERATIONS[id];
}

export function findAgentOperationByTool(tool: string): AgentOperationDefinition | null {
  return listAgentOperations().find((operation) => operation.mcpTool === tool) ?? null;
}

/**
 * Derived from the capability catalog rather than restated here, so REST and
 * MCP can never disagree with the gateway about which calls need a key.
 */
export function agentOperationRequiresIdempotency(operation: AgentOperationDefinition): boolean {
  if (!operation.capabilityKey) return false;
  return getAiCapability(operation.capabilityKey)?.idempotency === 'REQUIRED';
}
