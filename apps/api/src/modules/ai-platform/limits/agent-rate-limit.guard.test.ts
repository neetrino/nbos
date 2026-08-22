import type { ExecutionContext } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticatedAgentFixture } from '../../../test-utils/authenticated-agent';
import { AgentAccessException } from '../auth/agent-auth.errors';
import {
  AGENT_MAX_REQUEST_BYTES,
  AGENT_RATE_LIMIT_HEADERS,
  AGENT_REQUEST_LIMIT_PER_WINDOW,
} from './agent-rate-limit.constants';
import { AgentRateLimitGuard } from './agent-rate-limit.guard';
import { AgentRateLimitService } from './agent-rate-limit.service';

interface HarnessContext {
  context: ExecutionContext;
  setHeader: ReturnType<typeof vi.fn>;
}

function contextFor(
  headers: Record<string, string | undefined>,
  authenticated = true,
): HarnessContext {
  const setHeader = vi.fn();
  const request = { headers, agent: authenticated ? authenticatedAgentFixture() : undefined };
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ headersSent: false, setHeader }),
    }),
  } as unknown as ExecutionContext;
  return { context, setHeader };
}

describe('AgentRateLimitGuard', () => {
  let guard: AgentRateLimitGuard;

  beforeEach(() => {
    guard = new AgentRateLimitGuard(new AgentRateLimitService());
  });

  it('allows a normal request and publishes the remaining budget', () => {
    const { context, setHeader } = contextFor({});

    expect(guard.canActivate(context)).toBe(true);
    expect(setHeader).toHaveBeenCalledWith(
      AGENT_RATE_LIMIT_HEADERS.limit,
      String(AGENT_REQUEST_LIMIT_PER_WINDOW),
    );
    expect(setHeader).toHaveBeenCalledWith(
      AGENT_RATE_LIMIT_HEADERS.remaining,
      String(AGENT_REQUEST_LIMIT_PER_WINDOW - 1),
    );
  });

  it('refuses an over-budget agent with a retry hint', () => {
    for (let call = 0; call < AGENT_REQUEST_LIMIT_PER_WINDOW; call += 1) {
      guard.canActivate(contextFor({}).context);
    }

    try {
      guard.canActivate(contextFor({}).context);
      expect.unreachable('the guard must refuse an over-budget agent');
    } catch (error) {
      expect(error).toBeInstanceOf(AgentAccessException);
      expect((error as AgentAccessException).code).toBe('AGENT_RATE_LIMITED');
      expect((error as AgentAccessException).retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  /**
   * The payload ceiling belongs to the agent body parser, which sees the real
   * bytes. A guard reading `Content-Length` would trust a header the client
   * writes, so it deliberately no longer looks at one.
   */
  it('leaves the payload ceiling to the transport instead of trusting a header', () => {
    const understated = contextFor({ 'content-length': String(AGENT_MAX_REQUEST_BYTES + 1) });

    expect(guard.canActivate(understated.context)).toBe(true);
  });

  it('ignores a request the authentication guard already rejected', () => {
    const anonymous = contextFor({}, false);

    expect(guard.canActivate(anonymous.context)).toBe(true);
    expect(anonymous.setHeader).not.toHaveBeenCalled();
  });
});
