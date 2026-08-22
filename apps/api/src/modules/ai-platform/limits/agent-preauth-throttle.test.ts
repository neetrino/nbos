import type { ExecutionContext } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentAccessException } from '../auth/agent-auth.errors';
import {
  agentPreAuthSourceKey,
  AgentPreAuthThrottleService,
} from './agent-preauth-throttle.service';
import { AgentPreAuthGuard } from './agent-preauth.guard';
import {
  AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW,
  AGENT_PREAUTH_REQUEST_LIMIT_PER_WINDOW,
  AGENT_PREAUTH_UNKNOWN_SOURCE,
  AGENT_RATE_LIMIT_WINDOW_MS,
} from './agent-rate-limit.constants';

const SOURCE = '203.0.113.7';
const OTHER_SOURCE = '198.51.100.2';
const NOW = 1_700_000_000_000;

function contextFor(ip: string | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ ip }),
      getResponse: () => ({ headersSent: false, setHeader: vi.fn() }),
    }),
  } as unknown as ExecutionContext;
}

describe('AgentPreAuthThrottleService (U 329)', () => {
  let service: AgentPreAuthThrottleService;

  beforeEach(() => {
    service = new AgentPreAuthThrottleService();
  });

  it('locks a source out after a burst of rejected authentications', () => {
    for (let attempt = 0; attempt < AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW; attempt += 1) {
      expect(service.consumeAttempt(SOURCE, NOW).allowed).toBe(true);
      service.recordFailure(SOURCE, NOW);
    }

    const denied = service.consumeAttempt(SOURCE, NOW);

    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('keeps the lockout local to the source that produced the failures', () => {
    for (let attempt = 0; attempt < AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW; attempt += 1) {
      service.recordFailure(SOURCE, NOW);
    }

    expect(service.consumeAttempt(SOURCE, NOW).allowed).toBe(false);
    expect(service.consumeAttempt(OTHER_SOURCE, NOW).allowed).toBe(true);
  });

  it('releases the lockout in the next window', () => {
    for (let attempt = 0; attempt < AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW; attempt += 1) {
      service.recordFailure(SOURCE, NOW);
    }

    expect(service.consumeAttempt(SOURCE, NOW).allowed).toBe(false);
    expect(service.consumeAttempt(SOURCE, NOW + AGENT_RATE_LIMIT_WINDOW_MS).allowed).toBe(true);
  });

  it('caps a flood that never fails authentication', () => {
    for (let attempt = 0; attempt < AGENT_PREAUTH_REQUEST_LIMIT_PER_WINDOW; attempt += 1) {
      expect(service.consumeAttempt(SOURCE, NOW).allowed).toBe(true);
    }

    expect(service.consumeAttempt(SOURCE, NOW).allowed).toBe(false);
  });

  it('accounts requests with no source address in one shared bucket', () => {
    expect(agentPreAuthSourceKey(undefined)).toBe(AGENT_PREAUTH_UNKNOWN_SOURCE);
    expect(agentPreAuthSourceKey('   ')).toBe(AGENT_PREAUTH_UNKNOWN_SOURCE);
    expect(agentPreAuthSourceKey(SOURCE)).toBe(SOURCE);
  });
});

describe('AgentPreAuthGuard', () => {
  let service: AgentPreAuthThrottleService;
  let guard: AgentPreAuthGuard;

  beforeEach(() => {
    service = new AgentPreAuthThrottleService();
    guard = new AgentPreAuthGuard(service);
  });

  it('admits a request within the source budget', () => {
    expect(guard.canActivate(contextFor(SOURCE))).toBe(true);
  });

  it('refuses a locked-out source with the contract rate-limit error', () => {
    for (let attempt = 0; attempt < AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW; attempt += 1) {
      service.recordFailure(SOURCE);
    }

    try {
      guard.canActivate(contextFor(SOURCE));
      expect.unreachable('the guard must refuse a locked-out source');
    } catch (error) {
      expect(error).toBeInstanceOf(AgentAccessException);
      expect((error as AgentAccessException).code).toBe('AGENT_RATE_LIMITED');
    }
  });
});
