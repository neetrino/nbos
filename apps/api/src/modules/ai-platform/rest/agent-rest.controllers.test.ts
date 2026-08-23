import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticatedAgentFixture } from '../../../test-utils/authenticated-agent';
import type { AgentProtocolInvoker } from '../protocol/agent-protocol.invoker';
import { AgentArtifactsController } from './agent-artifacts.controller';
import { AgentIdentityController } from './agent-identity.controller';
import { AgentTasksController } from './agent-tasks.controller';
import { withPathOverrides } from './agent-rest.input';

describe('agent REST controllers', () => {
  const agent = authenticatedAgentFixture();
  let invoke: ReturnType<typeof vi.fn>;
  let invoker: AgentProtocolInvoker;
  let identity: AgentIdentityController;
  let tasks: AgentTasksController;
  let artifacts: AgentArtifactsController;

  beforeEach(() => {
    invoke = vi.fn().mockResolvedValue({ data: null });
    invoker = { invoke } as unknown as AgentProtocolInvoker;
    identity = new AgentIdentityController(invoker);
    tasks = new AgentTasksController(invoker);
    artifacts = new AgentArtifactsController(invoker);
  });

  function lastInvocation(): Record<string, unknown> {
    return invoke.mock.calls[invoke.mock.calls.length - 1][0];
  }

  it('maps identity to the identity operation', async () => {
    await identity.me(agent);

    expect(lastInvocation()).toMatchObject({ operationId: 'identity.read', input: {} });
  });

  it('passes list pagination straight through', async () => {
    await identity.listWorkspaces(agent, '2', '10');

    expect(lastInvocation()).toMatchObject({
      operationId: 'workspaces.list',
      input: { page: '2', pageSize: '10' },
    });
  });

  it('maps each task route to its operation', async () => {
    await tasks.listTasks(agent, 'ws-1', 'OPEN', 'updatedAt', '1', '20');
    expect(lastInvocation()).toMatchObject({
      operationId: 'tasks.list',
      input: { workspaceId: 'ws-1', status: 'OPEN', sortBy: 'updatedAt' },
    });

    await tasks.getTask(agent, 'task-1');
    expect(lastInvocation()).toMatchObject({ operationId: 'tasks.get' });

    await tasks.getDiscussion(agent, 'task-1');
    expect(lastInvocation()).toMatchObject({ operationId: 'tasks.discussion' });

    await tasks.startTask(agent, 'task-1', {}, 'op-1');
    expect(lastInvocation()).toMatchObject({ operationId: 'tasks.start' });

    await tasks.submitReview(agent, 'task-1', {}, 'op-2');
    expect(lastInvocation()).toMatchObject({ operationId: 'tasks.submitReview' });
  });

  it('binds the Idempotency-Key header to the gateway key on every mutation', async () => {
    await tasks.createTask(agent, 'ws-1', { title: 'T' }, 'op-create');
    expect(lastInvocation()).toMatchObject({ idempotencyKey: 'op-create' });

    await tasks.updateTask(agent, 'task-1', { title: 'T2' }, 'op-update');
    expect(lastInvocation()).toMatchObject({ idempotencyKey: 'op-update' });

    await tasks.addComment(agent, 'task-1', { body: 'note' }, 'op-comment');
    expect(lastInvocation()).toMatchObject({ idempotencyKey: 'op-comment' });

    await artifacts.attachArtifact(agent, 'task-1', { contentBase64: 'YWJj' }, 'op-attach');
    expect(lastInvocation()).toMatchObject({ idempotencyKey: 'op-attach' });
  });

  it('forwards a missing Idempotency-Key so the gateway rejects it consistently', async () => {
    await tasks.createTask(agent, 'ws-1', { title: 'T' }, undefined);

    expect(lastInvocation().idempotencyKey).toBeUndefined();
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('lets the URL win over a body that names a different resource', async () => {
    await tasks.updateTask(
      agent,
      'task-authorized',
      { taskId: 'task-someone-else', title: 'T' },
      'op-1',
    );

    expect((lastInvocation().input as Record<string, unknown>).taskId).toBe('task-authorized');
  });

  it('lets the URL win over a body that names a different Work Space', async () => {
    await tasks.createTask(agent, 'ws-authorized', { workspaceId: 'ws-other', title: 'T' }, 'op-1');

    expect((lastInvocation().input as Record<string, unknown>).workspaceId).toBe('ws-authorized');
  });

  it('separates artifact content from the task metadata', async () => {
    await artifacts.attachArtifact(
      agent,
      'task-1',
      { fileName: 'a.txt', mimeType: 'text/plain', sizeBytes: 3, contentBase64: 'YWJj' },
      'op-1',
    );

    const invocation = lastInvocation();
    expect(invocation.contentBase64).toBe('YWJj');
    expect(invocation.input).toEqual({
      fileName: 'a.txt',
      mimeType: 'text/plain',
      sizeBytes: 3,
      taskId: 'task-1',
    });
  });

  it('addresses an artifact read through its owning task', async () => {
    await artifacts.getArtifact(agent, 'task-1', 'file-1');

    expect(lastInvocation()).toMatchObject({
      operationId: 'artifacts.get',
      input: { taskId: 'task-1', fileAssetId: 'file-1' },
    });
  });

  it('tolerates an absent body on a semantic transition', async () => {
    await tasks.startTask(agent, 'task-1', undefined, 'op-1');

    expect(lastInvocation().input).toEqual({ taskId: 'task-1' });
  });
});

describe('withPathOverrides', () => {
  it('keeps body fields that are not identifiers', () => {
    expect(withPathOverrides({ title: 'T' }, { taskId: 'task-1' })).toEqual({
      title: 'T',
      taskId: 'task-1',
    });
  });

  it('never lets the body override a path identifier', () => {
    expect(withPathOverrides({ taskId: 'evil' }, { taskId: 'task-1' })).toEqual({
      taskId: 'task-1',
    });
  });

  it('handles an absent body', () => {
    expect(withPathOverrides(null, { taskId: 'task-1' })).toEqual({ taskId: 'task-1' });
  });
});
