import { JSON_RPC_INVALID_REQUEST } from './agent-mcp.constants';

export const JSON_RPC_VERSION = '2.0';

export type JsonRpcId = string | number;

export interface JsonRpcRequest {
  id: JsonRpcId | null;
  method: string;
  params: Record<string, unknown>;
}

export interface JsonRpcSuccess {
  jsonrpc: typeof JSON_RPC_VERSION;
  id: JsonRpcId;
  result: unknown;
}

export interface JsonRpcFailure {
  jsonrpc: typeof JSON_RPC_VERSION;
  id: JsonRpcId | null;
  error: { code: number; message: string; data?: unknown };
}

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcFailure;

/**
 * Reads one JSON-RPC 2.0 message.
 *
 * A message without `id` is a notification: the caller expects no response.
 * Anything structurally invalid is reported as `Invalid Request` rather than
 * being guessed at, so a malformed frame can never be executed as a tool call.
 */
export function parseJsonRpcMessage(value: unknown): JsonRpcRequest | JsonRpcFailure {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return invalidRequest(null, 'Request must be a JSON-RPC 2.0 object');
  }
  const record = value as Record<string, unknown>;
  const id = readId(record.id);
  if (record.jsonrpc !== JSON_RPC_VERSION) {
    return invalidRequest(id, 'Unsupported JSON-RPC version');
  }
  if (typeof record.method !== 'string' || record.method.length === 0) {
    return invalidRequest(id, 'Missing JSON-RPC method');
  }
  return { id, method: record.method, params: readParams(record.params) };
}

export function isJsonRpcFailure(value: JsonRpcRequest | JsonRpcFailure): value is JsonRpcFailure {
  return 'error' in value;
}

export function isNotification(request: JsonRpcRequest): boolean {
  return request.id === null;
}

export function jsonRpcSuccess(id: JsonRpcId, result: unknown): JsonRpcSuccess {
  return { jsonrpc: JSON_RPC_VERSION, id, result };
}

export function jsonRpcFailure(
  id: JsonRpcId | null,
  code: number,
  message: string,
): JsonRpcFailure {
  return { jsonrpc: JSON_RPC_VERSION, id, error: { code, message } };
}

function invalidRequest(id: JsonRpcId | null, message: string): JsonRpcFailure {
  return jsonRpcFailure(id, JSON_RPC_INVALID_REQUEST, message);
}

function readId(value: unknown): JsonRpcId | null {
  if (typeof value === 'string' || typeof value === 'number') return value;
  return null;
}

function readParams(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
