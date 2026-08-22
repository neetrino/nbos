const MS_PER_SECOND = 1_000;

export interface AgentRateLimitCounter {
  /** Start of the window this counter is accumulating into. */
  windowStartedAt: number;
  used: number;
}

export interface AgentRateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Epoch milliseconds at which the current window rolls over. */
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * Fixed-window accounting shared by every agent budget.
 *
 * Pure so the budgets can be tested without a Nest context or a fake timer
 * transport: the caller owns the counter and supplies `now`.
 */
export function consumeFixedWindow(
  counter: AgentRateLimitCounter,
  limit: number,
  windowMs: number,
  now: number,
): AgentRateLimitDecision {
  if (now - counter.windowStartedAt >= windowMs) {
    counter.windowStartedAt = now;
    counter.used = 0;
  }
  const resetAt = counter.windowStartedAt + windowMs;
  if (counter.used >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt,
      retryAfterSeconds: retryAfterSecondsUntil(resetAt, now),
    };
  }
  counter.used += 1;
  return {
    allowed: true,
    limit,
    remaining: limit - counter.used,
    resetAt,
    retryAfterSeconds: 0,
  };
}

/** At least one second, so a client never reads `Retry-After: 0` and hot-loops. */
export function retryAfterSecondsUntil(resetAt: number, now: number): number {
  return Math.max(1, Math.ceil((resetAt - now) / MS_PER_SECOND));
}

export function createCounter(now: number): AgentRateLimitCounter {
  return { windowStartedAt: now, used: 0 };
}
