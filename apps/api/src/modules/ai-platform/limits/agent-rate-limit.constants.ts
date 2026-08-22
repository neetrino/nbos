import type { AiRateLimitClass } from '@nbos/shared';

const SECOND_MS = 1_000;
const KIB = 1024;

/**
 * Fixed accounting window for every External Agent budget.
 *
 * One minute is short enough that a throttled client recovers quickly and long
 * enough that a normal coding-agent burst (list a Work Space, read a handful of
 * tasks, post one comment) never touches a ceiling.
 */
export const AGENT_RATE_LIMIT_WINDOW_MS = 60 * SECOND_MS;

/**
 * Per-agent HTTP requests per window, counted across REST and MCP together
 * (checklist U 324).
 *
 * 600/min is a sustained 10 requests/second for one agent. A coding agent works
 * in bursts of a few calls per reasoning step, so this is far above normal use
 * and still bounds a runaway loop.
 */
export const AGENT_REQUEST_LIMIT_PER_WINDOW = 600;

/**
 * Requests per window from one source address before the credential is even
 * parsed (checklist U 329).
 *
 * Charged before any database or Argon2 work, so an unauthenticated flood is
 * bounded by process-local counters instead of by verification cost. It sits
 * above `AGENT_REQUEST_LIMIT_PER_WINDOW` on purpose: a single well-behaved
 * agent must always hit its own per-agent ceiling first, and this one only
 * catches traffic no authenticated budget would ever account for.
 */
export const AGENT_PREAUTH_REQUEST_LIMIT_PER_WINDOW = 900;

/**
 * Rejected authentications per window from one source address.
 *
 * Once a source has spent this many failures, further requests are refused
 * before the credential lookup and the Argon2 verification, so scanning for a
 * valid key id costs the attacker a counter increment rather than a database
 * round trip plus a password hash. A legitimate client fails at most once per
 * rotation, so the ceiling is far above correct use.
 */
export const AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW = 20;

/** Bucket for requests that arrive without a resolvable source address. */
export const AGENT_PREAUTH_UNKNOWN_SOURCE = 'unknown-source';

/**
 * Per-capability-class budgets per window (checklist U 325).
 *
 * The class comes from the capability catalog (`rateLimitClass`), so REST and
 * MCP inherit the same ceiling for the same capability without restating it.
 * Writes are far cheaper to abuse than to undo, so they are much tighter than
 * reads, and the two capabilities that create durable records
 * (`tasks.create`, `tasks.attach_artifact`) are tightest.
 */
export const AGENT_CAPABILITY_LIMIT_PER_WINDOW: Readonly<Record<AiRateLimitClass, number>> = {
  READ_STANDARD: 300,
  WRITE_STANDARD: 60,
  WRITE_SENSITIVE: 20,
};

/**
 * Concurrent in-flight capability invocations per agent (checklist U 327).
 *
 * A parallel agent normally fans out a handful of reads. Eight keeps that fast
 * while stopping one credential from occupying the request pool.
 */
export const AGENT_CONCURRENCY_LIMIT = 8;

/**
 * Back-off hint for a concurrency refusal, in milliseconds.
 *
 * A slot frees as soon as a peer request finishes rather than at a window
 * boundary, so the honest hint is the shortest retry a client should ever use,
 * which the contract then rounds up to one second.
 */
export const AGENT_CONCURRENCY_RETRY_HINT_MS = 1;

/**
 * Largest request body an agent route accepts (checklist U 326).
 *
 * Enforced on the bytes actually read from the socket by the agent-scoped body
 * parser, so a chunked, absent or understated `Content-Length` buys nothing.
 * Deliberately below the global 1 MB express cap so an oversized agent request
 * is refused with the `09` machine envelope instead of the employee-facing
 * body-parser error. It stays above one maximum inline artifact
 * (512 KiB → 683 KiB of base64) plus its JSON metadata.
 */
export const AGENT_MAX_REQUEST_BYTES = 768 * KIB;

/**
 * Largest JSON-RPC batch an MCP request may carry.
 *
 * Without this, one HTTP request could hold thousands of `tools/call` messages
 * and amortise the per-request budget to nothing. Twenty is more than any
 * current MCP client batches.
 */
export const AGENT_MCP_MAX_BATCH_MESSAGES = 20;

/**
 * How long an idle agent's counters are kept before the sweeper drops them.
 * Two windows, so a client pausing between bursts is never charged twice for
 * the same window boundary.
 */
export const AGENT_RATE_LIMIT_RETENTION_MS = 2 * AGENT_RATE_LIMIT_WINDOW_MS;

/** Response headers that expose the per-agent request budget. */
export const AGENT_RATE_LIMIT_HEADERS = {
  limit: 'X-RateLimit-Limit',
  remaining: 'X-RateLimit-Remaining',
  reset: 'X-RateLimit-Reset',
  retryAfter: 'Retry-After',
} as const;
