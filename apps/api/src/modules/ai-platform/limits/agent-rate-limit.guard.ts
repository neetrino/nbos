import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Response } from 'express';
import { AgentAccessException } from '../auth/agent-auth.errors';
import type { AgentProtocolRequest } from '../protocol/agent-protocol.request';
import { AGENT_RATE_LIMIT_HEADERS } from './agent-rate-limit.constants';
import { AgentRateLimitService } from './agent-rate-limit.service';
import type { AgentRateLimitDecision } from './agent-rate-limit.window';

const MS_PER_SECOND = 1_000;

/**
 * Per-agent request budget for the agent namespace (checklist U 324, U 328).
 *
 * Runs immediately after `AgentAuthGuard`, so the budget is charged to the
 * authenticated agent rather than to a source address that many agents could
 * share, and before `AgentUsageInterceptor`, so a credential past its ceiling
 * stops buying usage writes. The payload ceiling belongs to the agent body
 * parser, which enforces it on real bytes before anything is parsed.
 * Unauthenticated traffic is metered earlier still, by `AgentPreAuthGuard`.
 */
@Injectable()
export class AgentRateLimitGuard implements CanActivate {
  constructor(private readonly limits: AgentRateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<AgentProtocolRequest>();
    const agentId = request.agent?.agentId;
    if (!agentId) return true;

    const decision = await this.limits.consumeRequest(agentId);
    this.writeHeaders(http.getResponse<Response>(), decision);
    if (!decision.allowed) {
      throw AgentAccessException.rateLimited(decision.retryAfterSeconds);
    }
    return true;
  }

  private writeHeaders(response: Response, decision: AgentRateLimitDecision): void {
    if (response.headersSent) return;
    response.setHeader(AGENT_RATE_LIMIT_HEADERS.limit, String(decision.limit));
    response.setHeader(AGENT_RATE_LIMIT_HEADERS.remaining, String(decision.remaining));
    response.setHeader(
      AGENT_RATE_LIMIT_HEADERS.reset,
      String(Math.ceil(decision.resetAt / MS_PER_SECOND)),
    );
  }
}
