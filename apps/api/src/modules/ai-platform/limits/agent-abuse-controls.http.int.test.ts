import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { rawHttpRequest } from '../../../test-utils/raw-http-request';
import { AgentAccessException } from '../auth/agent-auth.errors';
import {
  AGENT_TOKEN,
  signEmployeeAccessToken,
  startAgentProtocolHarness,
  type AgentProtocolHarness,
} from '../protocol/agent-protocol.http.harness';
import {
  AGENT_MAX_REQUEST_BYTES,
  AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW,
  AGENT_REQUEST_LIMIT_PER_WINDOW,
} from './agent-rate-limit.constants';

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_PAYLOAD_TOO_LARGE = 413;
const EMPLOYEE_THROTTLE_LIMIT = 3;
const OVER_THE_EMPLOYEE_CAP_BYTES = 1_500_000;
const UNDERSTATED_CONTENT_LENGTH = 12;
/**
 * Enough to prove the parser stops at the declared length, small enough that
 * the server's early answer still reaches the client before the write ends.
 */
const UNDERSTATED_BODY_BYTES = 4096;
const AGENT_TASKS_PATH = '/v1/agent/workspaces/ws-1/tasks';

interface AgentErrorPayload {
  error: { code: string; message: string; requestId: string };
}

/** Valid JSON of exactly `bytes` length, so a ceiling can be probed on both sides. */
function jsonOfExactSize(bytes: number): string {
  const envelope = JSON.stringify({ title: '' });
  return JSON.stringify({ title: 'x'.repeat(Math.max(0, bytes - envelope.length)) });
}

async function postRawAgentBody(
  harness: AgentProtocolHarness,
  body: string,
  options: { chunked?: boolean; contentLength?: number } = {},
): Promise<{ status: number; body: string }> {
  const url = new URL(`${harness.baseUrl}${AGENT_TASKS_PATH}`);
  const payload = Buffer.from(body, 'utf8');
  const response = await rawHttpRequest({
    url,
    method: 'POST',
    chunked: options.chunked,
    headers: {
      authorization: `Bearer ${AGENT_TOKEN}`,
      'content-type': 'application/json',
      'idempotency-key': 'op-raw',
      ...(options.chunked
        ? {}
        : { 'content-length': String(options.contentLength ?? payload.length) }),
    },
    // Two writes, so a server that stops reading early is observed doing so.
    bodyChunks: [payload.subarray(0, 1), payload.subarray(1)],
  });
  return { status: response.status, body: response.body };
}

/**
 * Abuse controls that must hold before a credential has been verified, and
 * payload ceilings that must hold on real bytes (checklist U 326, U 329).
 */
describe('agent abuse controls over HTTP', () => {
  describe('unauthenticated traffic is bounded before the credential is verified', () => {
    let harness: AgentProtocolHarness;

    beforeAll(async () => {
      harness = await startAgentProtocolHarness();
    });

    afterAll(async () => {
      await harness?.close();
    });

    beforeEach(() => {
      harness.resetMocks();
      harness.authenticate.mockRejectedValue(
        AgentAccessException.fromDenyReason('CREDENTIAL_INVALID'),
      );
    });

    it('stops calling the credential verifier once a source has spent its failures', async () => {
      for (let attempt = 0; attempt < AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW; attempt += 1) {
        await harness.agentFetch('/v1/agent/me');
      }
      const verificationsBefore = harness.authenticate.mock.calls.length;

      const refused = await harness.agentFetch('/v1/agent/me');

      expect(verificationsBefore).toBe(AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW);
      expect(harness.authenticate.mock.calls.length).toBe(verificationsBefore);
      expect(refused.status).toBe(HTTP_TOO_MANY_REQUESTS);
      expect(((await refused.json()) as AgentErrorPayload).error.code).toBe('AGENT_RATE_LIMITED');
    });
  });

  describe('an exhausted agent stops buying work', () => {
    let harness: AgentProtocolHarness;

    beforeAll(async () => {
      harness = await startAgentProtocolHarness();
    });

    afterAll(async () => {
      await harness?.close();
    });

    it('records no further usage telemetry once the per-agent budget is spent', async () => {
      for (let call = 0; call < AGENT_REQUEST_LIMIT_PER_WINDOW; call += 1) {
        await harness.agentFetch('/v1/agent/me');
      }
      const usageWritesBefore = harness.recordUsage.mock.calls.length;

      const refused = await harness.agentFetch('/v1/agent/me');

      expect(usageWritesBefore).toBe(AGENT_REQUEST_LIMIT_PER_WINDOW);
      expect(harness.recordUsage.mock.calls.length).toBe(usageWritesBefore);
      expect(refused.status).toBe(HTTP_TOO_MANY_REQUESTS);
    });
  });

  describe('employee capacity survives an agent flood', () => {
    let harness: AgentProtocolHarness;

    beforeAll(async () => {
      harness = await startAgentProtocolHarness({
        employeeThrottleLimit: EMPLOYEE_THROTTLE_LIMIT,
      });
    });

    afterAll(async () => {
      await harness?.close();
    });

    it('serves an employee route while an agent hammers the namespace', async () => {
      for (let call = 0; call < EMPLOYEE_THROTTLE_LIMIT * 4; call += 1) {
        await harness.agentFetch('/v1/agent/me');
      }

      const employee = await harness.rawFetch('/tasks/probe', {
        headers: { authorization: `Bearer ${signEmployeeAccessToken()}` },
      });

      expect(employee.status).toBe(HTTP_OK);
      expect(await employee.json()).toMatchObject({ data: { ok: true } });
    });
  });

  describe('payload ceiling on real bytes', () => {
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

    it('refuses a chunked body that never declares a length', async () => {
      const response = await postRawAgentBody(
        harness,
        jsonOfExactSize(AGENT_MAX_REQUEST_BYTES + 1024),
        { chunked: true },
      );

      expect(response.status).toBe(HTTP_PAYLOAD_TOO_LARGE);
      expect(response.body).toContain('AGENT_VALIDATION_FAILED');
      expect(harness.gatewayInvoke).not.toHaveBeenCalled();
    });

    it('refuses a body larger than the employee transport cap in the agent envelope', async () => {
      const response = await postRawAgentBody(
        harness,
        jsonOfExactSize(OVER_THE_EMPLOYEE_CAP_BYTES),
        { chunked: true },
      );

      expect(response.status).toBe(HTTP_PAYLOAD_TOO_LARGE);
      expect(response.body).toContain('AGENT_VALIDATION_FAILED');
      expect(response.body).toContain('requestId');
    });

    /**
     * The parser reads exactly the declared length, so the surplus is never
     * part of the body; the transport then refuses those bytes as a malformed
     * follow-up request and closes the connection.
     */
    it('never parses more than the declared length when the header understates it', async () => {
      const response = await postRawAgentBody(harness, jsonOfExactSize(UNDERSTATED_BODY_BYTES), {
        contentLength: UNDERSTATED_CONTENT_LENGTH,
      });

      expect(response.status).toBe(HTTP_BAD_REQUEST);
      expect(harness.gatewayInvoke).not.toHaveBeenCalled();
    });

    it('still accepts a body exactly at the ceiling', async () => {
      const response = await postRawAgentBody(harness, jsonOfExactSize(AGENT_MAX_REQUEST_BYTES));

      expect(response.status).not.toBe(HTTP_PAYLOAD_TOO_LARGE);
      expect(harness.gatewayInvoke).toHaveBeenCalled();
    });
  });
});
