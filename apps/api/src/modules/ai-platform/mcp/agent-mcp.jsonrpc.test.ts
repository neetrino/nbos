import { describe, expect, it } from 'vitest';
import { JSON_RPC_INVALID_REQUEST } from './agent-mcp.constants';
import {
  isJsonRpcFailure,
  isNotification,
  jsonRpcFailure,
  jsonRpcSuccess,
  parseJsonRpcMessage,
} from './agent-mcp.jsonrpc';

describe('MCP JSON-RPC framing', () => {
  it('parses a well-formed request', () => {
    const parsed = parseJsonRpcMessage({
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: { name: 'nbos_get_task' },
    });

    expect(isJsonRpcFailure(parsed)).toBe(false);
    expect(parsed).toMatchObject({ id: 7, method: 'tools/call' });
  });

  it('treats a message without an id as a notification', () => {
    const parsed = parseJsonRpcMessage({ jsonrpc: '2.0', method: 'notifications/initialized' });

    expect(isJsonRpcFailure(parsed)).toBe(false);
    expect(isNotification(parsed as { id: null; method: string; params: object })).toBe(true);
  });

  it.each([
    ['a non-object frame', 'nope'],
    ['an array frame', []],
    ['a null frame', null],
  ])('rejects %s', (_label, value) => {
    const parsed = parseJsonRpcMessage(value);

    expect(isJsonRpcFailure(parsed)).toBe(true);
    expect(parsed).toMatchObject({ error: { code: JSON_RPC_INVALID_REQUEST } });
  });

  it('rejects a wrong protocol version', () => {
    const parsed = parseJsonRpcMessage({ jsonrpc: '1.0', id: 1, method: 'ping' });

    expect(isJsonRpcFailure(parsed)).toBe(true);
  });

  it('rejects a missing method rather than guessing one', () => {
    const parsed = parseJsonRpcMessage({ jsonrpc: '2.0', id: 1 });

    expect(isJsonRpcFailure(parsed)).toBe(true);
    expect(parsed).toMatchObject({ id: 1 });
  });

  it('normalizes malformed params to an empty object', () => {
    const parsed = parseJsonRpcMessage({ jsonrpc: '2.0', id: 1, method: 'ping', params: 'x' });

    expect(parsed).toMatchObject({ params: {} });
  });

  it('builds success and failure frames with the version echoed', () => {
    expect(jsonRpcSuccess(1, { ok: true })).toEqual({
      jsonrpc: '2.0',
      id: 1,
      result: { ok: true },
    });
    expect(jsonRpcFailure(1, -32601, 'nope')).toEqual({
      jsonrpc: '2.0',
      id: 1,
      error: { code: -32601, message: 'nope' },
    });
  });
});
