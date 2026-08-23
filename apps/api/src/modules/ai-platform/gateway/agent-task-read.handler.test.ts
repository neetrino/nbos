import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actorContextFromMachine } from '@nbos/shared';
import { AgentAccessException } from '../auth/agent-auth.errors';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentTaskReadHandler } from './agent-task-read.handler';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';

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

describe('AgentTaskReadHandler isolation', () => {
  let prisma: MockPrisma;
  let policy: { assertAllowed: ReturnType<typeof vi.fn>; evaluate: ReturnType<typeof vi.fn> };
  let tasks: { findAll: ReturnType<typeof vi.fn>; findById: ReturnType<typeof vi.fn> };
  let discussion: { listEntries: ReturnType<typeof vi.fn> };
  let access: { requireAuthorizedTask: ReturnType<typeof vi.fn> };
  let handler: AgentTaskReadHandler;

  beforeEach(() => {
    prisma = createMockPrisma();
    policy = {
      assertAllowed: vi.fn().mockResolvedValue({ outcome: 'ALLOW' }),
      evaluate: vi.fn().mockResolvedValue({ outcome: 'ALLOW' }),
    };
    tasks = {
      findAll: vi.fn().mockResolvedValue({ items: [], meta: { total: 0, page: 1, pageSize: 20 } }),
      findById: vi.fn(),
    };
    discussion = { listEntries: vi.fn() };
    access = { requireAuthorizedTask: vi.fn() };
    handler = new AgentTaskReadHandler(
      prisma as never,
      policy as never,
      tasks as never,
      discussion as never,
      access as never,
    );
  });

  it('uses the same not-available error for a foreign workspace and a missing one', async () => {
    prisma.workSpace.findUnique.mockResolvedValue(null);
    policy.assertAllowed.mockRejectedValue(AgentAccessException.resourceNotAvailable());

    await expect(handler.list(agent(), { workspaceId: 'ws-b' })).rejects.toMatchObject({
      code: 'AGENT_RESOURCE_NOT_AVAILABLE',
    });
    await expect(handler.list(agent(), { workspaceId: 'missing' })).rejects.toMatchObject({
      code: 'AGENT_RESOURCE_NOT_AVAILABLE',
    });
    expect(tasks.findAll).not.toHaveBeenCalled();
  });

  it('passes SENSITIVE classification for discussion reads', async () => {
    access.requireAuthorizedTask.mockResolvedValue({
      task: { id: 'task-1' },
      workspace: { id: 'ws-a' },
    });
    discussion.listEntries.mockResolvedValue({
      items: [],
      meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 },
    });

    await handler.readDiscussion(agent(), { taskId: 'task-1' });

    expect(access.requireAuthorizedTask).toHaveBeenCalledWith(
      expect.anything(),
      'tasks.read_discussion',
      'task-1',
      'SENSITIVE',
    );
  });

  it('lists tasks only after policy allows the resolved workspace', async () => {
    prisma.workSpace.findUnique.mockResolvedValue({
      id: 'ws-a',
      name: 'Alpha',
      type: 'STANDALONE_OPERATIONAL',
      projectId: null,
      productId: null,
      extensionId: null,
      scrumEnabled: false,
    });
    await handler.list(agent(), { workspaceId: 'ws-a' });
    expect(policy.assertAllowed).toHaveBeenCalledWith(
      expect.objectContaining({
        capabilityKey: 'tasks.list',
        target: expect.objectContaining({ workspaceId: 'ws-a' }),
      }),
    );
    expect(tasks.findAll).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 'ws-a' }));
  });

  it('rejects an invalid list status before calling Tasks', async () => {
    prisma.workSpace.findUnique.mockResolvedValue({
      id: 'ws-a',
      name: 'Alpha',
      type: 'STANDALONE_OPERATIONAL',
      projectId: null,
      productId: null,
      extensionId: null,
      scrumEnabled: false,
    });
    await expect(
      handler.list(agent(), { workspaceId: 'ws-a', status: 'DONE' }),
    ).rejects.toMatchObject({ code: 'AGENT_VALIDATION_FAILED' });
    expect(tasks.findAll).not.toHaveBeenCalled();
  });

  it('omits a same-workspace Task B when evaluate denies RESOURCE scope', async () => {
    access.requireAuthorizedTask.mockResolvedValue({
      task: {
        id: 'task-a',
        links: [
          { entityType: 'TASK', entityId: 'task-a' },
          { entityType: 'TASK', entityId: 'task-b' },
        ],
      },
      workspace: {
        id: 'ws-a',
        name: 'Alpha',
        type: 'STANDALONE_OPERATIONAL',
        projectId: 'proj-a',
        productId: 'prod-a',
        extensionId: null,
        scrumEnabled: false,
      },
    });
    prisma.task.findFirst.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve({ id: where.id, workspaceId: 'ws-a' }),
    );
    prisma.workSpace.findUnique.mockResolvedValue({
      id: 'ws-a',
      name: 'Alpha',
      type: 'STANDALONE_OPERATIONAL',
      projectId: 'proj-a',
      productId: 'prod-a',
      extensionId: null,
      scrumEnabled: false,
    });
    policy.evaluate.mockImplementation(async (query: { target: { resourceId?: string | null } }) =>
      query.target.resourceId === 'task-a'
        ? { outcome: 'ALLOW' }
        : { outcome: 'DENY', reason: 'RESOURCE_OUT_OF_SCOPE' },
    );

    const links = await handler.readLinks(agent(), { taskId: 'task-a' });
    expect(links).toEqual([{ linkType: 'ENTITY', entityType: 'TASK', entityId: 'task-a' }]);
    expect(policy.assertAllowed).not.toHaveBeenCalled();
  });
});
