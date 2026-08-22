import { describe, expect, it } from 'vitest';
import { AI_CAPABILITIES_FORBIDDEN_PHASE_1, getAiCapability } from '@nbos/shared';
import {
  agentOperationRequiresIdempotency,
  findAgentOperationByTool,
  listAgentOperations,
  AGENT_OPERATION_IDS,
} from './agent-operation.registry';

/** Canonical tool names from `09-External-Agent-API-and-MCP-Contract.md` §12. */
const CANON_TOOLS = [
  'nbos_get_identity',
  'nbos_list_workspaces',
  'nbos_get_workspace',
  'nbos_list_tasks',
  'nbos_get_task',
  'nbos_create_task',
  'nbos_update_task',
  'nbos_start_task',
  'nbos_get_task_discussion',
  'nbos_add_task_comment',
  'nbos_list_task_artifacts',
  'nbos_get_task_artifact',
  'nbos_attach_task_artifact',
  'nbos_submit_task_review',
];

/** Capability mapping from `09` §3 and §13. */
const CANON_CAPABILITY_BY_TOOL: Record<string, string | null> = {
  nbos_get_identity: null,
  nbos_list_workspaces: 'workspaces.read',
  nbos_get_workspace: 'workspaces.read',
  nbos_list_tasks: 'tasks.list',
  nbos_get_task: 'tasks.read',
  nbos_create_task: 'tasks.create',
  nbos_update_task: 'tasks.update',
  nbos_start_task: 'tasks.start',
  nbos_get_task_discussion: 'tasks.read_discussion',
  nbos_add_task_comment: 'tasks.comment',
  nbos_list_task_artifacts: 'drive.read_task_artifact',
  nbos_get_task_artifact: 'drive.read_task_artifact',
  nbos_attach_task_artifact: 'tasks.attach_artifact',
  nbos_submit_task_review: 'tasks.submit_review',
};

describe('agent operation registry', () => {
  it('publishes exactly the canonical Phase 1 tool set', () => {
    const tools = listAgentOperations().map((operation) => operation.mcpTool);
    expect([...tools].sort()).toEqual([...CANON_TOOLS].sort());
  });

  it('maps every tool to the capability the contract assigns it', () => {
    for (const operation of listAgentOperations()) {
      expect(operation.capabilityKey).toBe(CANON_CAPABILITY_BY_TOOL[operation.mcpTool]);
    }
  });

  it('resolves every capability against the shared catalog', () => {
    for (const operation of listAgentOperations()) {
      if (!operation.capabilityKey) continue;
      expect(getAiCapability(operation.capabilityKey)).toBeDefined();
    }
  });

  it('never exposes a Phase 1 forbidden capability', () => {
    const exposed = listAgentOperations().map((operation) => operation.capabilityKey);
    for (const forbidden of AI_CAPABILITIES_FORBIDDEN_PHASE_1) {
      expect(exposed).not.toContain(forbidden);
    }
  });

  it('has no delete, force-complete or generic status operation', () => {
    const surface = listAgentOperations()
      .map((operation) => `${operation.mcpTool} ${operation.capabilityKey ?? ''}`)
      .join(' ');
    expect(surface).not.toMatch(/delete/i);
    expect(surface).not.toMatch(/force_complete|force-complete/i);
    expect(surface).not.toMatch(/set_status/i);
    expect(surface).not.toMatch(/credential|secret|vault/i);
  });

  it('derives idempotency from the capability catalog instead of restating it', () => {
    for (const operation of listAgentOperations()) {
      const expected = operation.capabilityKey
        ? getAiCapability(operation.capabilityKey)?.idempotency === 'REQUIRED'
        : false;
      expect(agentOperationRequiresIdempotency(operation)).toBe(expected);
    }
  });

  it('requires an operation key for exactly the six mutations', () => {
    const mutations = listAgentOperations()
      .filter(agentOperationRequiresIdempotency)
      .map((operation) => operation.mcpTool);
    expect([...mutations].sort()).toEqual([
      'nbos_add_task_comment',
      'nbos_attach_task_artifact',
      'nbos_create_task',
      'nbos_start_task',
      'nbos_submit_task_review',
      'nbos_update_task',
    ]);
  });

  it('accepts binary content only for artifact attach', () => {
    const binary = listAgentOperations()
      .filter((operation) => operation.acceptsBinaryContent)
      .map((operation) => operation.id);
    expect(binary).toEqual(['artifacts.attach']);
  });

  it('gives every operation a distinct REST route and MCP tool', () => {
    const routes = listAgentOperations().map((operation) => operation.restRoute);
    const tools = listAgentOperations().map((operation) => operation.mcpTool);
    expect(new Set(routes).size).toBe(AGENT_OPERATION_IDS.length);
    expect(new Set(tools).size).toBe(AGENT_OPERATION_IDS.length);
  });

  it('resolves a tool name back to its operation and rejects unknown names', () => {
    expect(findAgentOperationByTool('nbos_get_task')?.id).toBe('tasks.get');
    expect(findAgentOperationByTool('nbos_delete_task')).toBeNull();
  });
});
