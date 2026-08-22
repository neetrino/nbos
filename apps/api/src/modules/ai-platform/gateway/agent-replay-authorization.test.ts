import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actorContextFromMachine, getAiCapability, listAiCapabilities } from '@nbos/shared';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AgentAccessException } from '../auth/agent-auth.errors';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import type { AgentPolicyService } from '../policy/agent-policy.service';
import { AgentReplayAuthorization } from './agent-replay-authorization';
import type { AgentTaskAccess } from './agent-task-access';

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

  it('covers every idempotent write capability with a resolvable target field', () => {
    const idempotent = listAiCapabilities().filter(
      (definition) => definition.idempotency === 'REQUIRED',
    );

    expect(idempotent.length).toBeGreaterThan(0);
    for (const definition of idempotent) {
      const fields = definition.input.fields as readonly string[];
      expect(fields.includes('taskId') || fields.includes('workspaceId')).toBe(true);
    }
  });
});
