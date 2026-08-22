import { Injectable } from '@nestjs/common';
import {
  AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW,
  AGENT_PREAUTH_REQUEST_LIMIT_PER_WINDOW,
  AGENT_PREAUTH_UNKNOWN_SOURCE,
  AGENT_RATE_LIMIT_RETENTION_MS,
  AGENT_RATE_LIMIT_WINDOW_MS,
} from './agent-rate-limit.constants';
import {
  consumeFixedWindow,
  createCounter,
  retryAfterSecondsUntil,
  type AgentRateLimitCounter,
  type AgentRateLimitDecision,
} from './agent-rate-limit.window';

interface PreAuthBudget {
  attempts: AgentRateLimitCounter;
  failures: AgentRateLimitCounter;
  lastSeenAt: number;
}

/** Source address of an agent request, or the shared bucket when it is absent. */
export function agentPreAuthSourceKey(ipAddress: string | undefined | null): string {
  const trimmed = ipAddress?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : AGENT_PREAUTH_UNKNOWN_SOURCE;
}

/**
 * Abuse control for agent traffic that has not been authenticated yet
 * (checklist U 329).
 *
 * The per-agent budgets in `AgentRateLimitService` can only be charged once a
 * credential has been resolved, which costs a database lookup and an Argon2
 * verification. That work is exactly what an unauthenticated flood wants to
 * buy, so this service meters the source address first, purely from in-memory
 * counters, and additionally locks a source out after a burst of rejected
 * authentications.
 *
 * It is deliberately not the employee `ThrottlerGuard`: agent traffic must
 * never consume the capacity employees share, in either direction.
 *
 * State is per API process, like every other Phase 1 budget. With N instances a
 * source reaches at most N times these ceilings — bounded and recorded, but not
 * exact; a shared store is the upgrade path when the API is scaled out.
 */
@Injectable()
export class AgentPreAuthThrottleService {
  private readonly budgets = new Map<string, PreAuthBudget>();

  /**
   * Charges one unauthenticated request against the source address.
   *
   * A source that has already spent its failure allowance is refused without
   * consuming an attempt, so the lockout cannot be extended by more traffic.
   */
  consumeAttempt(sourceKey: string, now = Date.now()): AgentRateLimitDecision {
    const budget = this.budgetFor(sourceKey, now);
    const lockout = this.failureLockout(budget, now);
    if (lockout) return lockout;
    return consumeFixedWindow(
      budget.attempts,
      AGENT_PREAUTH_REQUEST_LIMIT_PER_WINDOW,
      AGENT_RATE_LIMIT_WINDOW_MS,
      now,
    );
  }

  /** One rejected authentication, whatever the reason the caller was given. */
  recordFailure(sourceKey: string, now = Date.now()): void {
    const budget = this.budgetFor(sourceKey, now);
    consumeFixedWindow(
      budget.failures,
      AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW,
      AGENT_RATE_LIMIT_WINDOW_MS,
      now,
    );
  }

  private failureLockout(budget: PreAuthBudget, now: number): AgentRateLimitDecision | null {
    if (now - budget.failures.windowStartedAt >= AGENT_RATE_LIMIT_WINDOW_MS) {
      budget.failures = createCounter(now);
      return null;
    }
    if (budget.failures.used < AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW) {
      return null;
    }
    const resetAt = budget.failures.windowStartedAt + AGENT_RATE_LIMIT_WINDOW_MS;
    return {
      allowed: false,
      limit: AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW,
      remaining: 0,
      resetAt,
      retryAfterSeconds: retryAfterSecondsUntil(resetAt, now),
    };
  }

  private budgetFor(sourceKey: string, now: number): PreAuthBudget {
    this.sweep(now);
    const existing = this.budgets.get(sourceKey);
    if (existing) {
      existing.lastSeenAt = now;
      return existing;
    }
    const created: PreAuthBudget = {
      attempts: createCounter(now),
      failures: createCounter(now),
      lastSeenAt: now,
    };
    this.budgets.set(sourceKey, created);
    return created;
  }

  /** Drops idle sources so the map cannot grow with every address ever seen. */
  private sweep(now: number): void {
    for (const [sourceKey, budget] of this.budgets) {
      if (now - budget.lastSeenAt > AGENT_RATE_LIMIT_RETENTION_MS) {
        this.budgets.delete(sourceKey);
      }
    }
  }
}
