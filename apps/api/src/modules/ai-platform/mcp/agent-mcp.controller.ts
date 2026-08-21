import { Body, Controller, Delete, Get, HttpCode, Post, Res } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentChannel } from '../auth/agent-channel.decorator';
import { AGENT_CORRELATION_HEADER } from '../protocol/agent-correlation';
import {
  AgentProtocolEndpoints,
  AGENT_REST_NAMESPACE,
  CurrentAgent,
  CurrentCorrelationId,
} from '../protocol/agent-protocol.decorators';
import { AGENT_MCP_ROUTE } from './agent-mcp.constants';
import { isJsonRpcFailure, parseJsonRpcMessage, type JsonRpcResponse } from './agent-mcp.jsonrpc';
import { AgentMcpServer } from './agent-mcp.server';

const HTTP_OK = 200;
const HTTP_ACCEPTED = 202;
const HTTP_METHOD_NOT_ALLOWED = 405;

/**
 * Remote MCP endpoint over Streamable HTTP.
 *
 * Stateless: each request carries its own bearer credential and is resolved to
 * the same `ActorContext` a REST call would produce, so there is no session to
 * hijack and no second permission model. Server-initiated streaming is not
 * offered in Phase 1, so `GET` and `DELETE` answer 405 as the specification
 * allows for a server without an SSE channel.
 */
@AgentProtocolEndpoints()
@AgentChannel('mcp')
@Controller(`${AGENT_REST_NAMESPACE}/${AGENT_MCP_ROUTE}`)
export class AgentMcpController {
  constructor(private readonly server: AgentMcpServer) {}

  @Post()
  @ApiOperation({
    summary: 'MCP Streamable HTTP endpoint',
    description:
      'JSON-RPC 2.0. Supports initialize, ping, tools/list and tools/call with the same ' +
      'capabilities, authorization and idempotency as the REST namespace.',
  })
  async rpc(
    @CurrentAgent() agent: AuthenticatedAgent,
    @CurrentCorrelationId() correlationId: string,
    @Body() body: unknown,
    @Res() response: Response,
  ): Promise<void> {
    const responses = await this.handleBatch(agent, body);
    response.setHeader(AGENT_CORRELATION_HEADER, correlationId);
    if (responses.length === 0) {
      response.status(HTTP_ACCEPTED).send();
      return;
    }
    const payload = Array.isArray(body) ? responses : responses[0];
    response.status(HTTP_OK).json(payload);
  }

  @Get()
  @HttpCode(HTTP_METHOD_NOT_ALLOWED)
  @ApiExcludeEndpoint()
  openStream(): void {
    // No server-initiated stream in Phase 1.
  }

  @Delete()
  @HttpCode(HTTP_METHOD_NOT_ALLOWED)
  @ApiExcludeEndpoint()
  closeSession(): void {
    // Stateless server: there is no session to terminate.
  }

  private async handleBatch(agent: AuthenticatedAgent, body: unknown): Promise<JsonRpcResponse[]> {
    const messages = Array.isArray(body) ? body : [body];
    const responses: JsonRpcResponse[] = [];
    for (const message of messages) {
      const response = await this.handleOne(agent, message);
      if (response) {
        responses.push(response);
      }
    }
    return responses;
  }

  private async handleOne(
    agent: AuthenticatedAgent,
    message: unknown,
  ): Promise<JsonRpcResponse | null> {
    const parsed = parseJsonRpcMessage(message);
    if (isJsonRpcFailure(parsed)) {
      return parsed;
    }
    return this.server.handle(agent, parsed);
  }
}
