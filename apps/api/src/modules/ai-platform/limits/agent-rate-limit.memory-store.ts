import {
  AGENT_CONCURRENCY_RETRY_HINT_MS,
  AGENT_RATE_LIMIT_RETENTION_MS,
  AGENT_RATE_LIMIT_WINDOW_MS,
} from './agent-rate-limit.constants';
import type { AgentRateLimitStore, AgentRateLimitWindowKind } from './agent-rate-limit.store';
import {
  consumeFixedWindow,
  createCounter,
  retryAfterSecondsUntil,
  type AgentRateLimitCounter,
  type AgentRateLimitDecision,
} from './agent-rate-limit.window';

interface MemoryBudget {
  windows: Map<string, AgentRateLimitCounter>;
  inFlight: number;
  lastSeenAt: number;
}

/**
 * Process-local store used when Redis is unset (tests, single-instance dev).
 * Production API replicas must use the Redis store so ceilings are not multiplied.
 */
export class MemoryAgentRateLimitStore implements AgentRateLimitStore {
  private readonly budgets = new Map<string, MemoryBudget>();

  async consumeWindow(
    kind: AgentRateLimitWindowKind,
    id: string,
    limit: number,
    windowMs: number,
    now: number,
  ): Promise<AgentRateLimitDecision> {
    const budget = this.budgetFor(id, now);
    const key = `${kind}:${id}`;
    let counter = budget.windows.get(key);
    if (!counter) {
      counter = createCounter(now);
      budget.windows.set(key, counter);
    }
    return consumeFixedWindow(counter, limit, windowMs, now);
  }

  async peekWindow(
    kind: AgentRateLimitWindowKind,
    id: string,
    limit: number,
    windowMs: number,
    now: number,
  ): Promise<AgentRateLimitDecision> {
    const budget = this.budgetFor(id, now);
    const key = `${kind}:${id}`;
    const counter = budget.windows.get(key) ?? createCounter(now);
    const snapshot = { windowStartedAt: counter.windowStartedAt, used: counter.used };
    if (now - snapshot.windowStartedAt >= windowMs) {
      snapshot.windowStartedAt = now;
      snapshot.used = 0;
    }
    const resetAt = snapshot.windowStartedAt + windowMs;
    const remaining = Math.max(0, limit - snapshot.used);
    return {
      allowed: snapshot.used < limit,
      limit,
      remaining,
      resetAt,
      retryAfterSeconds: snapshot.used < limit ? 0 : retryAfterSecondsUntil(resetAt, now),
    };
  }

  async acquireSlot(agentId: string, limit: number, now: number): Promise<AgentRateLimitDecision> {
    const budget = this.budgetFor(agentId, now);
    const resetAt = now + AGENT_RATE_LIMIT_WINDOW_MS;
    if (budget.inFlight >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt,
        retryAfterSeconds: retryAfterSecondsUntil(now + AGENT_CONCURRENCY_RETRY_HINT_MS, now),
      };
    }
    budget.inFlight += 1;
    return {
      allowed: true,
      limit,
      remaining: limit - budget.inFlight,
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  async releaseSlot(agentId: string): Promise<void> {
    const budget = this.budgets.get(agentId);
    if (!budget || budget.inFlight === 0) return;
    budget.inFlight -= 1;
  }

  private budgetFor(id: string, now: number): MemoryBudget {
    this.sweep(now);
    const existing = this.budgets.get(id);
    if (existing) {
      existing.lastSeenAt = now;
      return existing;
    }
    const created: MemoryBudget = { windows: new Map(), inFlight: 0, lastSeenAt: now };
    this.budgets.set(id, created);
    return created;
  }

  private sweep(now: number): void {
    for (const [id, budget] of this.budgets) {
      if (budget.inFlight === 0 && now - budget.lastSeenAt > AGENT_RATE_LIMIT_RETENTION_MS) {
        this.budgets.delete(id);
      }
    }
  }
}
