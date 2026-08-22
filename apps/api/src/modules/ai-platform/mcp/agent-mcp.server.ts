import { Injectable } from '@nestjs/common';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { toAgentErrorResponse } from '../protocol/agent-error.envelope';
import { findAgentOperationByTool } from '../protocol/agent-operation.registry';
import { AgentProtocolInvoker } from '../protocol/agent-protocol.invoker';
import {
  AGENT_MCP_DEFAULT_PROTOCOL_VERSION,
  AGENT_MCP_SERVER_INFO,
  AGENT_MCP_SUPPORTED_PROTOCOL_VERSIONS,
  JSON_RPC_METHOD_NOT_FOUND,
} from './agent-mcp.constants';
import {
  isNotification,
  jsonRpcFailure,
  jsonRpcSuccess,
  type JsonRpcRequest,
  type JsonRpcResponse,
} from './agent-mcp.jsonrpc';
import { listAgentMcpTools, MCP_CONTENT_FIELD, MCP_OPERATION_ID_FIELD } from './agent-mcp.tools';

const SERVER_INSTRUCTIONS =
  'NBOS work management tools. Every call is authorized server-side against the ' +
  'capabilities granted to this agent; a tool being listed does not mean it is permitted ' +
  'on a given Work Space or Task. Tasks cannot be deleted or force-completed.';

/**
 * MCP method handling for External Agents.
 *
 * A pure translation layer: it resolves a tool name to a registry operation and
 * hands the arguments to `AgentProtocolInvoker`. It holds no policy, reads no
 * database and knows nothing about Tasks or Drive.
 */
@Injectable()
export class AgentMcpServer {
  constructor(private readonly invoker: AgentProtocolInvoker) {}

  async handle(
    agent: AuthenticatedAgent,
    request: JsonRpcRequest,
  ): Promise<JsonRpcResponse | null> {
    if (isNotification(request)) {
      return null;
    }
    const id = request.id as NonNullable<JsonRpcRequest['id']>;
    switch (request.method) {
      case 'initialize':
        return jsonRpcSuccess(id, this.initialize(request.params));
      case 'ping':
        return jsonRpcSuccess(id, {});
      case 'tools/list':
        return jsonRpcSuccess(id, { tools: listAgentMcpTools() });
      case 'tools/call':
        return jsonRpcSuccess(id, await this.callTool(agent, request.params));
      default:
        return jsonRpcFailure(id, JSON_RPC_METHOD_NOT_FOUND, `Unknown method: ${request.method}`);
    }
  }

  private initialize(params: Record<string, unknown>): Record<string, unknown> {
    return {
      protocolVersion: negotiateProtocolVersion(params.protocolVersion),
      capabilities: { tools: { listChanged: false } },
      serverInfo: AGENT_MCP_SERVER_INFO,
      instructions: SERVER_INSTRUCTIONS,
    };
  }

  /**
   * Tool execution failures are reported inside the result with `isError`, as
   * the MCP specification requires, so the model can read the deny code. The
   * code and message are produced by the same mapper the REST filter uses,
   * which keeps a denial identical on both transports.
   */
  private async callTool(
    agent: AuthenticatedAgent,
    params: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const correlationId = agent.actor.correlationId ?? '';
    const name = typeof params.name === 'string' ? params.name : '';
    const operation = findAgentOperationByTool(name);
    if (!operation) {
      return toolError({
        code: 'AGENT_VALIDATION_FAILED',
        message: `Unknown tool: ${name}`,
        requestId: correlationId,
      });
    }
    const args = readArguments(params.arguments);
    const {
      [MCP_OPERATION_ID_FIELD]: clientOperationId,
      [MCP_CONTENT_FIELD]: content,
      ...input
    } = args;
    try {
      const body = await this.invoker.invoke({
        agent,
        operationId: operation.id,
        input,
        idempotencyKey: typeof clientOperationId === 'string' ? clientOperationId : null,
        contentBase64: content,
      });
      return toolSuccess(body);
    } catch (error) {
      return toolError(toAgentErrorResponse(error, correlationId).body.error);
    }
  }
}

export function negotiateProtocolVersion(requested: unknown): string {
  if (
    typeof requested === 'string' &&
    (AGENT_MCP_SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(requested)
  ) {
    return requested;
  }
  return AGENT_MCP_DEFAULT_PROTOCOL_VERSION;
}

function readArguments(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function toolSuccess(body: unknown): Record<string, unknown> {
  return {
    content: [{ type: 'text', text: JSON.stringify(body) }],
    structuredContent: body,
    isError: false,
  };
}

function toolError(error: {
  code: string;
  message: string;
  requestId?: string;
}): Record<string, unknown> {
  const payload = { error };
  return {
    content: [{ type: 'text', text: JSON.stringify(payload) }],
    structuredContent: payload,
    isError: true,
  };
}
