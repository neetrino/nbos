import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actorContextFromMachine, getAiCapability, listAiCapabilities } from '@nbos/shared';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AgentAccessException } from '../auth/agent-auth.errors';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import type { AgentPolicyService } from '../policy/agent-policy.service';
import { AgentReplayAuthorization } from './agent-replay-authorization';
import type { AgentTaskAccess } from './agent-task-access';
import { AGENT_OPERATIONS } from '../protocol/agent-operation.registry';

function agent(): AuthenticatedAgent {
  return {
    agentId: 'agent-1',
    agentName: 'Cursor Agent',
    agentState: 'ACTIVE',
    credentialId: 'cred-1',
    credentialKeyId: 'aabbccddeeff001122',
    credentialState: 'ACTIVE',
    actor: actorContextFromMachine({
      id: 'agent-1',
      type: 'EXTERNAL_AGENT',
      displayName: 'Cursor Agent',
    }),
  };
}

function capability(key: string) {
  const definition = getAiCapability(key);
  if (!definition) throw new Error(`unknown capability ${key}`);
  return definition;
}

describe('AgentReplayAuthorization (AL 626)', () => {
  let prisma: MockPrisma;
  let assertAllowed: ReturnType<typeof vi.fn>;
  let requireAuthorizedTask: ReturnType<typeof vi.fn>;
  let authorization: AgentReplayAuthorization;

  beforeEach(() => {
    prisma = createMockPrisma();
    assertAllowed = vi.fn().mockResolvedValue({ outcome: 'ALLOW' });
    requireAuthorizedTask = vi.fn().mockResolvedValue({ task: { id: 'task-1' } });
    authorization = new AgentReplayAuthorization(
      prisma as never,
      { assertAllowed } as unknown as AgentPolicyService,
      { requireAuthorizedTask } as unknown as AgentTaskAccess,
    );
  });

  it('re-asserts task policy for a task-scoped replay', async () => {
    await authorization.assertStillAuthorized(agent(), capability('tasks.update'), {
      taskId: 'task-1',
      title: 'Fix',
    });

    expect(requireAuthorizedTask).toHaveBeenCalledWith(
      expect.objectContaining({ agentId: 'agent-1' }),
      'tasks.update',
      'task-1',
      undefined,
    );
  });

  it('re-asserts attach replay with INTERNAL classification', async () => {
    await authorization.assertStillAuthorized(agent(), capability('tasks.attach_artifact'), {
      taskId: 'task-1',
      fileName: 'note.txt',
      mimeType: 'text/plain',
      sizeBytes: 4,
    });

    expect(requireAuthorizedTask).toHaveBeenCalledWith(
      expect.objectContaining({ agentId: 'agent-1' }),
      'tasks.attach_artifact',
      'task-1',
      'INTERNAL',
    );
  });

  it('propagates a denial raised by the task authorization path', async () => {
    requireAuthorizedTask.mockRejectedValue(
      AgentAccessException.fromDenyReason('CAPABILITY_GRANT_REVOKED'),
    );

    await expect(
      authorization.assertStillAuthorized(agent(), capability('tasks.comment'), {
        taskId: 'task-1',
      }),
    ).rejects.toBeInstanceOf(AgentAccessException);
  });

  it('re-asserts workspace policy for a workspace-scoped replay', async () => {
    prisma.workSpace.findUnique.mockResolvedValue({
      id: 'ws-1',
      name: 'Delivery',
      type: 'PRODUCT',
      projectId: 'proj-1',
      productId: 'prod-1',
      extensionId: null,
      scrumEnabled: false,
    });

    await authorization.assertStillAuthorized(agent(), capability('tasks.create'), {
      workspaceId: 'ws-1',
      title: 'Fix',
    });

    expect(assertAllowed).toHaveBeenCalledWith(
      expect.objectContaining({ capabilityKey: 'tasks.create' }),
    );
  });

  it('reports an unresolvable workspace as unavailable rather than allowed', async () => {
    prisma.workSpace.findUnique.mockResolvedValue(null);

    await expect(
      authorization.assertStillAuthorized(agent(), capability('tasks.create'), {
        workspaceId: 'ws-missing',
      }),
    ).rejects.toBeInstanceOf(AgentAccessException);
    expect(assertAllowed).toHaveBeenCalled();
  });

  it('covers every idempotent External Agent write with a resolvable target field', () => {
    const protocolKeys = new Set(
      Object.values(AGENT_OPERATIONS)
        .map((operation) => operation.capabilityKey)
        .filter((key): key is string => Boolean(key)),
    );
    const idempotent = listAiCapabilities().filter(
      (definition) => definition.idempotency === 'REQUIRED' && protocolKeys.has(definition.key),
    );

    expect(idempotent.length).toBeGreaterThan(0);
    for (const definition of idempotent) {
      const fields = definition.input.fields as readonly string[];
      expect(fields.includes('taskId') || fields.includes('workspaceId')).toBe(true);
    }
  });
});
