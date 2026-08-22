import { json } from 'express';
import type { ErrorRequestHandler, Request, RequestHandler } from 'express';
import { AgentAccessException } from '../auth/agent-auth.errors';
import { AGENT_CORRELATION_HEADER, resolveAgentCorrelationId } from '../protocol/agent-correlation';
import { toAgentErrorResponse } from '../protocol/agent-error.envelope';
import { AGENT_REST_NAMESPACE } from '../protocol/agent-protocol.decorators';
import { AGENT_MAX_REQUEST_BYTES } from './agent-rate-limit.constants';

/** Transport path of the agent namespace, including the global `api` prefix. */
export const AGENT_HTTP_PATH_PREFIX = `/api/${AGENT_REST_NAMESPACE}`;

/** Body-parser failures that are the client's transport mistake, not a fault. */
const OVERSIZED_BODY_TYPES = new Set([
  'entity.too.large',
  'request.size.did.not.match.content.length',
]);
const MALFORMED_BODY_TYPES = new Set([
  'entity.parse.failed',
  'entity.verify.failed',
  'encoding.unsupported',
  'charset.unsupported',
]);

interface BodyParserError extends Error {
  type?: string;
}

/**
 * Body parser for the agent namespace (checklist U 326).
 *
 * Mounted before the global 1 MB parser and scoped to the agent prefix, so the
 * ceiling is applied to the bytes actually read from the socket: a chunked,
 * missing or understated `Content-Length` cannot buy a larger body, and an
 * oversized request is refused by the agent cap rather than by the employee
 * transport cap. `type` matches every content type on purpose — the namespace
 * speaks JSON only, so a body in any other encoding must hit the same ceiling
 * instead of falling through to a parser with a larger one.
 */
export function createAgentJsonBodyParser(): RequestHandler {
  return json({ limit: AGENT_MAX_REQUEST_BYTES, type: () => true });
}

/**
 * Renders body-parser refusals on the agent namespace in the `09` envelope.
 *
 * Without this, a request rejected by the transport would answer with the
 * express error page instead of `{ error: { code, message, requestId } }`,
 * because the failure happens before Nest routing and so never reaches
 * `AgentProtocolExceptionFilter`.
 */
export function createAgentBodyLimitErrorHandler(): ErrorRequestHandler {
  return (error, request, response, next) => {
    const mapped = isAgentRequestPath(requestPath(request)) ? toAgentBodyError(error) : null;
    if (!mapped || response.headersSent) {
      next(error);
      return;
    }
    const requestId = resolveAgentCorrelationId(readHeader(request, AGENT_CORRELATION_HEADER));
    const { status, body } = toAgentErrorResponse(mapped, requestId);
    response.setHeader(AGENT_CORRELATION_HEADER, requestId);
    response.status(status).json(body);
  };
}

export function isAgentRequestPath(path: string): boolean {
  return path === AGENT_HTTP_PATH_PREFIX || path.startsWith(`${AGENT_HTTP_PATH_PREFIX}/`);
}

/**
 * Maps a body-parser failure to the agent contract, or `null` when the error
 * belongs to someone else and must keep travelling down the express chain.
 */
export function toAgentBodyError(error: unknown): AgentAccessException | null {
  const type = (error as BodyParserError | null)?.type;
  if (typeof type !== 'string') return null;
  if (OVERSIZED_BODY_TYPES.has(type)) {
    return AgentAccessException.payloadTooLarge(
      `Request body exceeds ${AGENT_MAX_REQUEST_BYTES} bytes`,
    );
  }
  return MALFORMED_BODY_TYPES.has(type) ? AgentAccessException.validationFailed() : null;
}

function requestPath(request: Request): string {
  const url = request.originalUrl || request.url || '';
  const queryAt = url.indexOf('?');
  return queryAt === -1 ? url : url.slice(0, queryAt);
}

function readHeader(request: Request, name: string): string | undefined {
  const value = request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}
