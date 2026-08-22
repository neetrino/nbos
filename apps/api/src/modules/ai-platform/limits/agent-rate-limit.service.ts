import { Injectable } from '@nestjs/common';
import type { AiRateLimitClass } from '@nbos/shared';
import {
  AGENT_CAPABILITY_LIMIT_PER_WINDOW,
  AGENT_CONCURRENCY_LIMIT,
  AGENT_CONCURRENCY_RETRY_HINT_MS,
  AGENT_RATE_LIMIT_RETENTION_MS,
  AGENT_RATE_LIMIT_WINDOW_MS,
  AGENT_REQUEST_LIMIT_PER_WINDOW,
} from './agent-rate-limit.constants';
import {
  consumeFixedWindow,
  createCounter,
  retryAfterSecondsUntil,
  type AgentRateLimitCounter,
  type AgentRateLimitDecision,
} from './agent-rate-limit.window';

interface AgentBudget {
  requests: AgentRateLimitCounter;
  capabilities: Map<AiRateLimitClass, AgentRateLimitCounter>;
  inFlight: number;
  lastSeenAt: number;
}

/**
 * Per-agent abuse controls for the External Agent protocols (checklist U).
 *
 * Deliberately a separate budget from the employee `ThrottlerGuard`: agent
 * routes skip the global throttler entirely, so a runaway agent exhausts only
 * its own ceiling and never the capacity employees share (checklist U 329).
 *
 * State is per API process and in memory. Phase 1 runs no shared counter store,
 * so with N API instances an agent can reach at most N times these ceilings —
 * bounded and recorded, but not exact. A shared store is the upgrade path when
 * the API is scaled horizontally.
 */
@Injectable()
export class AgentRateLimitService {
  private readonly budgets = new Map<string, AgentBudget>();

  /** One HTTP request against the agent namespace, REST or MCP. */
  consumeRequest(agentId: string, now = Date.now()): AgentRateLimitDecision {
    const budget = this.budgetFor(agentId, now);
    return consumeFixedWindow(
      budget.requests,
      AGENT_REQUEST_LIMIT_PER_WINDOW,
      AGENT_RATE_LIMIT_WINDOW_MS,
      now,
    );
  }

  /** One capability invocation, charged to the class the catalog assigned it. */
  consumeCapability(
    agentId: string,
    rateLimitClass: AiRateLimitClass,
    now = Date.now(),
  ): AgentRateLimitDecision {
    const budget = this.budgetFor(agentId, now);
    let counter = budget.capabilities.get(rateLimitClass);
    if (!counter) {
      counter = createCounter(now);
      budget.capabilities.set(rateLimitClass, counter);
    }
    return consumeFixedWindow(
      counter,
      AGENT_CAPABILITY_LIMIT_PER_WINDOW[rateLimitClass],
      AGENT_RATE_LIMIT_WINDOW_MS,
      now,
    );
  }

  /**
   * Reserves one in-flight slot. The caller must `releaseSlot` in a `finally`,
   * otherwise a failed invocation would leak capacity for the process lifetime.
   */
  acquireSlot(agentId: string, now = Date.now()): AgentRateLimitDecision {
    const budget = this.budgetFor(agentId, now);
    const resetAt = now + AGENT_RATE_LIMIT_WINDOW_MS;
    if (budget.inFlight >= AGENT_CONCURRENCY_LIMIT) {
      return {
        allowed: false,
        limit: AGENT_CONCURRENCY_LIMIT,
        remaining: 0,
        resetAt,
        retryAfterSeconds: retryAfterSecondsUntil(now + AGENT_CONCURRENCY_RETRY_HINT_MS, now),
      };
    }
    budget.inFlight += 1;
    return {
      allowed: true,
      limit: AGENT_CONCURRENCY_LIMIT,
      remaining: AGENT_CONCURRENCY_LIMIT - budget.inFlight,
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  releaseSlot(agentId: string): void {
    const budget = this.budgets.get(agentId);
    if (!budget || budget.inFlight === 0) return;
    budget.inFlight -= 1;
  }

  private budgetFor(agentId: string, now: number): AgentBudget {
    this.sweep(now);
    const existing = this.budgets.get(agentId);
    if (existing) {
      existing.lastSeenAt = now;
      return existing;
    }
    const created: AgentBudget = {
      requests: createCounter(now),
      capabilities: new Map(),
      inFlight: 0,
      lastSeenAt: now,
    };
    this.budgets.set(agentId, created);
    return created;
  }

  /**
   * Drops idle agents so the map cannot grow with every credential ever seen.
   * An agent with work in flight is never dropped, because releasing its slot
   * afterwards would then underflow a fresh budget.
   */
  private sweep(now: number): void {
    for (const [agentId, budget] of this.budgets) {
      if (budget.inFlight === 0 && now - budget.lastSeenAt > AGENT_RATE_LIMIT_RETENTION_MS) {
        this.budgets.delete(agentId);
      }
    }
  }
}
