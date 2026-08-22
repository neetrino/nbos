import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Response } from 'express';
import { AgentAccessException } from '../auth/agent-auth.errors';
import { AGENT_RATE_LIMIT_HEADERS } from './agent-rate-limit.constants';
import {
  agentPreAuthSourceKey,
  AgentPreAuthThrottleService,
} from './agent-preauth-throttle.service';

interface PreAuthRequest {
  ip?: string;
}

/**
 * First guard on every agent route (checklist U 329).
 *
 * Runs before `AgentAuthGuard`, so a request that is only syntactically an
 * agent call is metered from in-memory counters before it can spend a
 * credential lookup, an Argon2 verification or a log line. Agent routes carry
 * `@SkipThrottle()`, so without this the namespace would have no ceiling at all
 * until a credential had already been verified.
 */
@Injectable()
export class AgentPreAuthGuard implements CanActivate {
  constructor(private readonly preAuth: AgentPreAuthThrottleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<PreAuthRequest>();
    const decision = await this.preAuth.consumeAttempt(agentPreAuthSourceKey(request.ip));
    if (decision.allowed) {
      return true;
    }
    const response = http.getResponse<Response>();
    if (!response.headersSent) {
      response.setHeader(AGENT_RATE_LIMIT_HEADERS.limit, String(decision.limit));
      response.setHeader(AGENT_RATE_LIMIT_HEADERS.remaining, '0');
    }
    throw AgentAccessException.rateLimited(decision.retryAfterSeconds);
  }
}
