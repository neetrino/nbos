import { describe, expect, it } from 'vitest';
import { getAiCapability } from '@nbos/shared';
import {
  agentOperationRequiresIdempotency,
  listAgentOperations,
} from '../protocol/agent-operation.registry';
import { listAgentMcpTools, MCP_CONTENT_FIELD, MCP_OPERATION_ID_FIELD } from './agent-mcp.tools';

function tool(name: string) {
  const found = listAgentMcpTools().find((candidate) => candidate.name === name);
  if (!found) throw new Error(`missing tool ${name}`);
  return found;
}

describe('MCP tool catalog', () => {
  it('publishes one tool per registry operation', () => {
    expect(listAgentMcpTools()).toHaveLength(listAgentOperations().length);
  });

  it('derives input properties from the capability catalog', () => {
    for (const operation of listAgentOperations()) {
      if (!operation.capabilityKey) continue;
      const fields = getAiCapability(operation.capabilityKey)?.input.fields ?? [];
      const properties = Object.keys(tool(operation.mcpTool).inputSchema.properties);
      for (const field of fields) {
        expect(properties).toContain(field);
      }
    }
  });

  it('closes every schema so an unexpected field is visible to the client too', () => {
    for (const definition of listAgentMcpTools()) {
      expect(definition.inputSchema.additionalProperties).toBe(false);
      expect(definition.inputSchema.type).toBe('object');
    }
  });

  it('requires a client operation id on exactly the mutating tools', () => {
    for (const operation of listAgentOperations()) {
      const schema = tool(operation.mcpTool).inputSchema;
      const required = schema.required ?? [];
      if (agentOperationRequiresIdempotency(operation)) {
        expect(schema.properties).toHaveProperty(MCP_OPERATION_ID_FIELD);
        expect(required).toContain(MCP_OPERATION_ID_FIELD);
      } else {
        expect(schema.properties).not.toHaveProperty(MCP_OPERATION_ID_FIELD);
      }
    }
  });

  it('offers binary content only on the attach tool', () => {
    const withContent = listAgentMcpTools()
      .filter((definition) => MCP_CONTENT_FIELD in definition.inputSchema.properties)
      .map((definition) => definition.name);

    expect(withContent).toEqual(['nbos_attach_task_artifact']);
  });

  it('publishes the enums the server actually enforces', () => {
    expect(tool('nbos_list_tasks').inputSchema.properties.status.enum).toEqual([
      'OPEN',
      'IN_PROGRESS',
      'REVIEW',
      'ON_HOLD',
      'COMPLETED',
    ]);
    expect(tool('nbos_create_task').inputSchema.properties.priority.enum).toEqual([
      'CRITICAL',
      'HIGH',
      'NORMAL',
      'LOW',
    ]);
  });

  it('marks the optimistic lock as required on update', () => {
    expect(tool('nbos_update_task').inputSchema.required).toContain('expectedUpdatedAt');
  });

  it('exposes identity without any capability field', () => {
    const identity = tool('nbos_get_identity');

    expect(identity.inputSchema.properties).toEqual({});
    expect(identity.description).toMatch(/does not list capabilities/i);
  });

  it('never advertises a delete, status-assignment or credentials tool', () => {
    const serialized = JSON.stringify(listAgentMcpTools()).toLowerCase();

    expect(serialized).not.toContain('delete');
    expect(serialized).not.toContain('set_status');
    expect(serialized).not.toContain('force_complete');
    expect(serialized).not.toContain('vault');
  });

  it('gives every tool a description a model can act on', () => {
    for (const definition of listAgentMcpTools()) {
      expect(definition.description.length).toBeGreaterThan(10);
      expect(definition.title.length).toBeGreaterThan(0);
    }
  });

  it('publishes a closed output schema on capability tools only', () => {
    for (const operation of listAgentOperations()) {
      const definition = tool(operation.mcpTool);
      if (!operation.capabilityKey) {
        expect(definition.outputSchema).toBeUndefined();
        continue;
      }
      expect(definition.outputSchema?.additionalProperties).toBe(false);
      expect(definition.outputSchema?.type).toBe('object');
    }
  });

  it('describes { items, meta } only on live list-envelope tools', () => {
    const listTools = ['nbos_list_workspaces', 'nbos_list_tasks', 'nbos_get_task_discussion'];
    for (const name of listTools) {
      const properties = tool(name).outputSchema?.properties ?? {};
      expect(properties).toHaveProperty('items');
      expect(properties).toHaveProperty('meta');
      expect(properties).not.toHaveProperty('page');
    }
    for (const definition of listAgentMcpTools()) {
      if (listTools.includes(definition.name) || !definition.outputSchema) continue;
      expect(definition.outputSchema.properties).not.toHaveProperty('items');
      expect(definition.outputSchema.properties).not.toHaveProperty('meta');
    }
  });
});
