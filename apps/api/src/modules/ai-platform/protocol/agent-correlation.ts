import { randomUUID } from 'node:crypto';

export const AGENT_CORRELATION_HEADER = 'x-correlation-id';
export const AGENT_REQUEST_ID_HEADER = 'x-request-id';

/** Long enough for a UUID or a client trace id, short enough to bound logs. */
const MAX_CORRELATION_LENGTH = 128;
const UNSAFE_CHARACTERS = /[^\w.:@/-]/g;

/**
 * Every REST/MCP invocation carries a correlation id.
 *
 * A client-supplied value is kept so a caller can join its own traces to NBOS
 * audit, but it is sanitized and bounded first: it ends up in logs and in audit
 * `ActorContext`, so it must not carry newlines or control characters. When the
 * client sends nothing, the protocol mints one — the gateway never invents it.
 */
export function resolveAgentCorrelationId(candidate: string | null | undefined): string {
  const sanitized = sanitizeCorrelationId(candidate);
  return sanitized ?? randomUUID();
}

export function sanitizeCorrelationId(candidate: string | null | undefined): string | null {
  if (typeof candidate !== 'string') return null;
  const cleaned = candidate.trim().replace(UNSAFE_CHARACTERS, '').slice(0, MAX_CORRELATION_LENGTH);
  return cleaned.length > 0 ? cleaned : null;
}
