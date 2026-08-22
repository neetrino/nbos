import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  signEmployeeAccessToken,
  startAgentProtocolHarness,
  type AgentProtocolHarness,
} from '../protocol/agent-protocol.http.harness';
import {
  AGENT_CAPABILITY_LIMIT_PER_WINDOW,
  AGENT_MAX_REQUEST_BYTES,
  AGENT_MCP_MAX_BATCH_MESSAGES,
  AGENT_RATE_LIMIT_HEADERS,
  AGENT_REQUEST_LIMIT_PER_WINDOW,
} from './agent-rate-limit.constants';

const EMPLOYEE_THROTTLE_LIMIT = 3;
const HTTP_OK = 200;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_PAYLOAD_TOO_LARGE = 413;
const SENSITIVE_WRITE_LIMIT = AGENT_CAPABILITY_LIMIT_PER_WINDOW.WRITE_SENSITIVE;

interface AgentErrorPayload {
  error: { code: string; message: string; requestId: string; retryAfterSeconds?: number };
}

function createTaskRequest(harness: AgentProtocolHarness, key: string): Promise<Response> {
  return harness.agentFetch('/v1/agent/workspaces/ws-1/tasks', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': key },
    body: JSON.stringify({ title: 'Generated task' }),
  });
}

function mcpCreateTaskRequest(harness: AgentProtocolHarness, key: string): Promise<Response> {
  return harness.agentFetch('/v1/agent/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: key,
      method: 'tools/call',
      params: {
        name: 'nbos_create_task',
        arguments: { workspaceId: 'ws-1', title: 'Generated task', clientOperationId: key },
      },
    }),
  });
}

/**
 * Abuse controls over real HTTP (checklist U 324–330).
 *
 * Every test here starts its own harness, because the per-agent budgets are
 * process state: sharing one app between cases would let an earlier test spend
 * a later test's budget.
 */
describe('agent rate limits over HTTP', () => {
  describe('per-capability budget', () => {
    let harness: AgentProtocolHarness;

    beforeAll(async () => {
      harness = await startAgentProtocolHarness();
    });

    afterAll(async () => {
      await harness?.close();
    });

    beforeEach(() => {
      harness.resetMocks();
      harness.gatewayInvoke.mockResolvedValue({
        capabilityKey: 'tasks.create',
        data: { id: 'task-1' },
      });
    });

    it('refuses a sensitive write past its ceiling with the contract code', async () => {
      for (let call = 0; call < SENSITIVE_WRITE_LIMIT; call += 1) {
        expect((await createTaskRequest(harness, `op-${call}`)).status).toBe(201);
      }

      const denied = await createTaskRequest(harness, 'op-over');

      expect(denied.status).toBe(HTTP_TOO_MANY_REQUESTS);
      expect(((await denied.json()) as AgentErrorPayload).error.code).toBe('AGENT_RATE_LIMITED');
    });

    it('returns retry metadata in both the body and the Retry-After header', async () => {
      for (let call = 0; call < SENSITIVE_WRITE_LIMIT; call += 1) {
        await createTaskRequest(harness, `op-${call}`);
      }

      const denied = await createTaskRequest(harness, 'op-over');
      const body = (await denied.json()) as AgentErrorPayload;

      expect(body.error.retryAfterSeconds).toBeGreaterThan(0);
      expect(denied.headers.get(AGENT_RATE_LIMIT_HEADERS.retryAfter)).toBe(
        String(body.error.retryAfterSeconds),
      );
    });

    it('never reaches the domain gateway once the budget is spent', async () => {
      for (let call = 0; call < SENSITIVE_WRITE_LIMIT; call += 1) {
        await createTaskRequest(harness, `op-${call}`);
      }
      const callsBefore = harness.gatewayInvoke.mock.calls.length;

      await createTaskRequest(harness, 'op-over');

      expect(harness.gatewayInvoke.mock.calls.length).toBe(callsBefore);
    });
  });

  describe('one budget across REST and MCP', () => {
    let harness: AgentProtocolHarness;

    beforeAll(async () => {
      harness = await startAgentProtocolHarness();
      harness.gatewayInvoke.mockResolvedValue({
        capabilityKey: 'tasks.create',
        data: { id: 'task-1' },
      });
    });

    afterAll(async () => {
      await harness?.close();
    });

    it('charges MCP tool calls to the same per-capability budget as REST', async () => {
      for (let call = 0; call < SENSITIVE_WRITE_LIMIT; call += 1) {
        await createTaskRequest(harness, `op-${call}`);
      }

      const denied = await mcpCreateTaskRequest(harness, 'op-mcp');
      const payload = (await denied.json()) as {
        result: { isError: boolean; structuredContent: AgentErrorPayload };
      };

      expect(payload.result.isError).toBe(true);
      expect(payload.result.structuredContent.error.code).toBe('AGENT_RATE_LIMITED');
    });
  });

  describe('response headers', () => {
    let harness: AgentProtocolHarness;

    beforeAll(async () => {
      harness = await startAgentProtocolHarness();
    });

    afterAll(async () => {
      await harness?.close();
    });

    it('publishes the per-agent request budget on a successful call', async () => {
      const response = await harness.agentFetch('/v1/agent/me');

      expect(response.headers.get(AGENT_RATE_LIMIT_HEADERS.limit)).toBe(
        String(AGENT_REQUEST_LIMIT_PER_WINDOW),
      );
      expect(Number(response.headers.get(AGENT_RATE_LIMIT_HEADERS.remaining))).toBeLessThan(
        AGENT_REQUEST_LIMIT_PER_WINDOW,
      );
      expect(Number(response.headers.get(AGENT_RATE_LIMIT_HEADERS.reset))).toBeGreaterThan(0);
    });
  });

  describe('payload ceilings', () => {
    let harness: AgentProtocolHarness;

    beforeAll(async () => {
      harness = await startAgentProtocolHarness();
    });

    afterAll(async () => {
      await harness?.close();
    });

    beforeEach(() => {
      harness.resetMocks();
    });

    it('refuses an oversized body without invoking a capability', async () => {
      const response = await harness.agentFetch('/v1/agent/workspaces/ws-1/tasks', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': 'op-big' },
        body: JSON.stringify({ title: 'x'.repeat(AGENT_MAX_REQUEST_BYTES) }),
      });

      expect(response.status).toBe(HTTP_PAYLOAD_TOO_LARGE);
      expect(((await response.json()) as AgentErrorPayload).error.code).toBe(
        'AGENT_VALIDATION_FAILED',
      );
      expect(harness.gatewayInvoke).not.toHaveBeenCalled();
    });

    it('refuses an oversized MCP batch', async () => {
      const batch = Array.from({ length: AGENT_MCP_MAX_BATCH_MESSAGES + 1 }, (_unused, index) => ({
        jsonrpc: '2.0',
        id: index,
        method: 'ping',
        params: {},
      }));

      const response = await harness.agentFetch('/v1/agent/mcp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(batch),
      });

      expect(response.status).toBe(HTTP_PAYLOAD_TOO_LARGE);
      expect(harness.gatewayInvoke).not.toHaveBeenCalled();
    });

    it('still serves a batch at the allowed size', async () => {
      const batch = Array.from({ length: AGENT_MCP_MAX_BATCH_MESSAGES }, (_unused, index) => ({
        jsonrpc: '2.0',
        id: index,
        method: 'ping',
        params: {},
      }));

      const response = await harness.agentFetch('/v1/agent/mcp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(batch),
      });

      expect(response.status).toBe(200);
      expect((await response.json()) as unknown[]).toHaveLength(AGENT_MCP_MAX_BATCH_MESSAGES);
    });
  });

  describe('employee API capacity is not shared (U 329)', () => {
    let harness: AgentProtocolHarness;

    beforeAll(async () => {
      harness = await startAgentProtocolHarness({
        employeeThrottleLimit: EMPLOYEE_THROTTLE_LIMIT,
      });
    });

    afterAll(async () => {
      await harness?.close();
    });

    it('leaves the employee throttler untouched no matter how much an agent calls', async () => {
      for (let call = 0; call < EMPLOYEE_THROTTLE_LIMIT * 4; call += 1) {
        await harness.agentFetch('/v1/agent/me');
      }

      const employee = await harness.rawFetch('/tasks/probe', {
        headers: { authorization: `Bearer ${signEmployeeAccessToken()}` },
      });

      // A served response, not merely "not 429": an employee route that answers
      // 500 would satisfy the weaker assertion while being just as broken.
      expect(employee.status).toBe(HTTP_OK);
    });

    it('does not let an exhausted employee throttler block an agent', async () => {
      for (let call = 0; call < EMPLOYEE_THROTTLE_LIMIT + 2; call += 1) {
        await harness.rawFetch('/tasks/probe', {
          headers: { authorization: `Bearer ${signEmployeeAccessToken()}` },
        });
      }
      const exhausted = await harness.rawFetch('/tasks/probe', {
        headers: { authorization: `Bearer ${signEmployeeAccessToken()}` },
      });

      const agent = await harness.agentFetch('/v1/agent/me');

      expect(exhausted.status).toBe(HTTP_TOO_MANY_REQUESTS);
      expect(agent.status).toBe(200);
    });
  });
});
