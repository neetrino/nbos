import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isActorChannelSource, toAgentExternalError, type ActorChannelSource } from '@nbos/shared';
import { AgentAuthenticatorService, type AuthenticatedAgent } from './agent-authenticator.service';
import { AgentAccessException } from './agent-auth.errors';
import { AGENT_CHANNEL_METADATA } from './agent-channel.decorator';

const BEARER_PREFIX = 'Bearer ';
const CORRELATION_HEADER = 'x-correlation-id';
const REQUEST_ID_HEADER = 'x-request-id';
const DEFAULT_CHANNEL: ActorChannelSource = 'rest';

/** Request shape the guard reads and augments. Never touches `request.user`. */
export interface AgentAuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  path?: string;
  agent?: AuthenticatedAgent;
  user?: unknown;
}

function headerValue(
  headers: AgentAuthenticatedRequest['headers'],
  name: string,
): string | undefined {
  const value = headers[name];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/**
 * Machine authentication boundary for External Agents.
 *
 * Deliberately not `EmployeeGuard`:
 * - the authenticated principal is written to `request.agent`, never
 *   `request.user`, so employee RBAC guards can never see an agent as a user;
 * - an employee JWT fails the agent token format check and is rejected;
 * - an agent token is not a valid JWT and so cannot pass `AuthGuard`.
 *
 * Routes using this guard must be marked `@Public()` so the global employee
 * auth chain is skipped rather than run in parallel, and MCP routes must carry
 * `@AgentChannel('mcp')`.
 */
@Injectable()
export class AgentAuthGuard implements CanActivate {
  constructor(
    private readonly authenticator: AgentAuthenticatorService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AgentAuthenticatedRequest>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new AgentAccessException(toAgentExternalError('CREDENTIAL_INVALID'));
    }

    request.agent = await this.authenticator.authenticate(token, {
      channel: this.resolveChannel(context),
      ipAddress: request.ip ?? null,
      userAgent: headerValue(request.headers, 'user-agent') ?? null,
      correlationId: headerValue(request.headers, CORRELATION_HEADER) ?? null,
      requestId: headerValue(request.headers, REQUEST_ID_HEADER) ?? null,
    });
    return true;
  }

  /**
   * Authorization header only. Query-string tokens are never accepted, so
   * credentials cannot leak into access logs or referrers.
   */
  private extractBearerToken(request: AgentAuthenticatedRequest): string | null {
    const authHeader = headerValue(request.headers, 'authorization');
    if (!authHeader?.startsWith(BEARER_PREFIX)) {
      return null;
    }
    const token = authHeader.slice(BEARER_PREFIX.length).trim();
    return token.length > 0 ? token : null;
  }

  /** Server-side route metadata only. Clients cannot label their own channel. */
  private resolveChannel(context: ExecutionContext): ActorChannelSource {
    const declared = this.reflector.getAllAndOverride<ActorChannelSource | undefined>(
      AGENT_CHANNEL_METADATA,
      [context.getHandler(), context.getClass()],
    );
    return declared && isActorChannelSource(declared) ? declared : DEFAULT_CHANNEL;
  }
}
