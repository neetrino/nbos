import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW,
  AGENT_PREAUTH_REQUEST_LIMIT_PER_WINDOW,
  AGENT_PREAUTH_UNKNOWN_SOURCE,
  AGENT_RATE_LIMIT_WINDOW_MS,
} from './agent-rate-limit.constants';
import { AGENT_RATE_LIMIT_STORE, type AgentRateLimitStore } from './agent-rate-limit.store';
import { MemoryAgentRateLimitStore } from './agent-rate-limit.memory-store';
import type { AgentRateLimitDecision } from './agent-rate-limit.window';

/** Source address of an agent request, or the shared bucket when it is absent. */
export function agentPreAuthSourceKey(ipAddress: string | undefined | null): string {
  const trimmed = ipAddress?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : AGENT_PREAUTH_UNKNOWN_SOURCE;
}

/**
 * Abuse control for agent traffic that has not been authenticated yet
 * (checklist U 329). Shares the same store as authenticated agent budgets so
 * multi-instance API replicas cannot multiply the pre-auth ceiling.
 */
@Injectable()
export class AgentPreAuthThrottleService {
  constructor(@Optional() @Inject(AGENT_RATE_LIMIT_STORE) store?: AgentRateLimitStore) {
    this.store = store ?? new MemoryAgentRateLimitStore();
  }

  private readonly store: AgentRateLimitStore;

  async consumeAttempt(sourceKey: string, now = Date.now()): Promise<AgentRateLimitDecision> {
    const lockout = await this.failureLockout(sourceKey, now);
    if (lockout) return lockout;
    return this.store.consumeWindow(
      'preauth-att',
      sourceKey,
      AGENT_PREAUTH_REQUEST_LIMIT_PER_WINDOW,
      AGENT_RATE_LIMIT_WINDOW_MS,
      now,
    );
  }

  async recordFailure(sourceKey: string, now = Date.now()): Promise<void> {
    await this.store.consumeWindow(
      'preauth-fail',
      sourceKey,
      AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW,
      AGENT_RATE_LIMIT_WINDOW_MS,
      now,
    );
  }

  private async failureLockout(
    sourceKey: string,
    now: number,
  ): Promise<AgentRateLimitDecision | null> {
    const peek = await this.store.peekWindow(
      'preauth-fail',
      sourceKey,
      AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW,
      AGENT_RATE_LIMIT_WINDOW_MS,
      now,
    );
    if (peek.allowed) return null;
    return peek;
  }
}
