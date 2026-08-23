import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actorContextFromMachine } from '@nbos/shared';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AgentAccessException } from '../auth/agent-auth.errors';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentTaskAccess } from './agent-task-access';

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

describe('AgentTaskAccess', () => {
  let prisma: MockPrisma;
  let policy: { assertAllowed: ReturnType<typeof vi.fn> };
  let tasks: { findById: ReturnType<typeof vi.fn> };
  let access: AgentTaskAccess;

  beforeEach(() => {
    prisma = createMockPrisma();
    policy = { assertAllowed: vi.fn().mockResolvedValue({ outcome: 'ALLOW' }) };
    tasks = { findById: vi.fn() };
    access = new AgentTaskAccess(prisma as never, policy as never, tasks as never);
  });

  it('passes the resolved Product Work Space id, not an Extension delivery id', async () => {
    tasks.findById.mockResolvedValue({
      id: 'task-1',
      workspaceId: 'ws-ext',
      trashedAt: null,
    });
    prisma.workSpace.findUnique.mockResolvedValue({
      id: 'ws-ext',
      name: 'Ext',
      type: 'EXTENSION_DELIVERY',
      projectId: 'proj-1',
      productId: null,
      extensionId: 'ext-1',
      scrumEnabled: false,
    });
    prisma.extension.findUnique.mockResolvedValue({ productId: 'prod-1' });
    prisma.workSpace.findFirst.mockResolvedValue({
      id: 'ws-product',
      name: 'Product',
      type: 'PRODUCT_DELIVERY',
      projectId: 'proj-1',
      productId: 'prod-1',
      extensionId: null,
      scrumEnabled: true,
    });

    const result = await access.requireAuthorizedTask(agent(), 'tasks.read', 'task-1');

    expect(result.workspace.id).toBe('ws-product');
    expect(policy.assertAllowed).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ workspaceId: 'ws-product', resourceId: 'task-1' }),
      }),
    );
  });

  it('uses the same not-available error for a missing task and a denied one', async () => {
    tasks.findById.mockRejectedValue(new NotFoundException('missing'));
    policy.assertAllowed.mockRejectedValue(AgentAccessException.resourceNotAvailable());
    await expect(
      access.requireAuthorizedTask(agent(), 'tasks.read', 'missing'),
    ).rejects.toMatchObject({ code: 'AGENT_RESOURCE_NOT_AVAILABLE' });

    tasks.findById.mockResolvedValue({ id: 'task-b', workspaceId: 'ws-b', trashedAt: null });
    prisma.workSpace.findUnique.mockResolvedValue({
      id: 'ws-b',
      name: 'Beta',
      type: 'STANDALONE_OPERATIONAL',
      projectId: null,
      productId: null,
      extensionId: null,
      scrumEnabled: false,
    });
    await expect(
      access.requireAuthorizedTask(agent(), 'tasks.read', 'task-b'),
    ).rejects.toMatchObject({ code: 'AGENT_RESOURCE_NOT_AVAILABLE' });
  });
});
