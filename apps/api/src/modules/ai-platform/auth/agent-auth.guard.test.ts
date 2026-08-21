import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AgentAuthGuard, type AgentAuthenticatedRequest } from './agent-auth.guard';
import { AgentAccessException } from './agent-auth.errors';
import type { AgentAuthenticatorService } from './agent-authenticator.service';

const AUTHENTICATED_AGENT = {
  agentId: 'agent-1',
  agentName: 'Cursor Agent',
  agentState: 'ACTIVE' as const,
  credentialId: 'cred-1',
  credentialKeyId: 'key-1',
  credentialState: 'ACTIVE' as const,
  actor: {
    actor: { id: 'agent-1', type: 'EXTERNAL_AGENT' as const, displayName: 'Cursor Agent' },
  },
};

function executionContext(request: AgentAuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  } as unknown as ExecutionContext;
}

describe('AgentAuthGuard', () => {
  let authenticator: AgentAuthenticatorService;
  let reflector: Reflector;
  let guard: AgentAuthGuard;

  function withDeclaredChannel(channel: string | undefined): void {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(channel);
  }

  beforeEach(() => {
    authenticator = {
      authenticate: vi.fn().mockResolvedValue(AUTHENTICATED_AGENT),
    } as unknown as AgentAuthenticatorService;
    reflector = new Reflector();
    guard = new AgentAuthGuard(authenticator, reflector);
  });

  it('attaches the agent to request.agent and never to request.user', async () => {
    const request: AgentAuthenticatedRequest = {
      headers: { authorization: 'Bearer nbos_agt_key_secret' },
    };

    await expect(guard.canActivate(executionContext(request))).resolves.toBe(true);
    expect(request.agent).toEqual(AUTHENTICATED_AGENT);
    expect(request.user).toBeUndefined();
  });

  it('rejects a request with no Authorization header', async () => {
    const request: AgentAuthenticatedRequest = { headers: {} };

    await expect(guard.canActivate(executionContext(request))).rejects.toThrow(
      AgentAccessException,
    );
    expect(authenticator.authenticate).not.toHaveBeenCalled();
  });

  it('rejects a non-bearer scheme', async () => {
    const request: AgentAuthenticatedRequest = { headers: { authorization: 'Basic abc123' } };

    await expect(guard.canActivate(executionContext(request))).rejects.toThrow(
      AgentAccessException,
    );
  });

  it('rejects an empty bearer value', async () => {
    const request: AgentAuthenticatedRequest = { headers: { authorization: 'Bearer    ' } };

    await expect(guard.canActivate(executionContext(request))).rejects.toThrow(
      AgentAccessException,
    );
  });

  it('never accepts a token from the query string', async () => {
    const request = {
      headers: {},
      query: { token: 'nbos_agt_key_secret' },
    } as unknown as AgentAuthenticatedRequest;

    await expect(guard.canActivate(executionContext(request))).rejects.toThrow(
      AgentAccessException,
    );
    expect(authenticator.authenticate).not.toHaveBeenCalled();
  });

  describe('channel provenance', () => {
    it('takes the MCP channel from route metadata', async () => {
      withDeclaredChannel('mcp');
      const request: AgentAuthenticatedRequest = {
        headers: { authorization: 'Bearer nbos_agt_key_secret' },
      };

      await guard.canActivate(executionContext(request));

      expect(authenticator.authenticate).toHaveBeenCalledWith(
        'nbos_agt_key_secret',
        expect.objectContaining({ channel: 'mcp' }),
      );
    });

    it('defaults to REST when a route declares nothing', async () => {
      withDeclaredChannel(undefined);
      const request: AgentAuthenticatedRequest = {
        headers: { authorization: 'Bearer nbos_agt_key_secret' },
      };

      await guard.canActivate(executionContext(request));

      expect(authenticator.authenticate).toHaveBeenCalledWith(
        'nbos_agt_key_secret',
        expect.objectContaining({ channel: 'rest' }),
      );
    });

    it('ignores a client-supplied channel header and a spoofed path', async () => {
      withDeclaredChannel(undefined);
      const request: AgentAuthenticatedRequest = {
        headers: {
          authorization: 'Bearer nbos_agt_key_secret',
          'x-nbos-agent-channel': 'mcp',
        },
        path: '/api/v1/agent/tasks?x=/mcp',
      };

      await guard.canActivate(executionContext(request));

      expect(authenticator.authenticate).toHaveBeenCalledWith(
        'nbos_agt_key_secret',
        expect.objectContaining({ channel: 'rest' }),
      );
    });

    it('ignores an unknown declared channel rather than trusting it', async () => {
      withDeclaredChannel('carrier-pigeon');
      const request: AgentAuthenticatedRequest = {
        headers: { authorization: 'Bearer nbos_agt_key_secret' },
      };

      await guard.canActivate(executionContext(request));

      expect(authenticator.authenticate).toHaveBeenCalledWith(
        'nbos_agt_key_secret',
        expect.objectContaining({ channel: 'rest' }),
      );
    });
  });

  it('forwards safe request metadata without secrets', async () => {
    const request: AgentAuthenticatedRequest = {
      headers: {
        authorization: 'Bearer nbos_agt_key_secret',
        'user-agent': 'cursor/1.0',
        'x-correlation-id': 'corr-1',
      },
      ip: '203.0.113.4',
    };

    await guard.canActivate(executionContext(request));

    const context = vi.mocked(authenticator.authenticate).mock.calls[0]![1];
    expect(context).toMatchObject({
      ipAddress: '203.0.113.4',
      userAgent: 'cursor/1.0',
      correlationId: 'corr-1',
    });
  });
});
