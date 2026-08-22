import { BadRequestException, ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actorContextFromMachine } from '@nbos/shared';
import { AgentAccessException } from '../auth/agent-auth.errors';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentTaskWriteHandler } from './agent-task-write.handler';
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

const TASK = {
  id: 'task-1',
  code: 'T-2026-1',
  title: 'Fix race',
  description: null,
  status: 'OPEN',
  priority: 'NORMAL',
  dueDate: null,
  workspaceId: 'ws-a',
  sprintId: null,
  updatedAt: new Date('2026-08-21T00:00:00.000Z'),
  reviewRequestedAt: null,
  trashedAt: null,
};

describe('AgentTaskWriteHandler', () => {
  let prisma: MockPrisma;
  let policy: { assertAllowed: ReturnType<typeof vi.fn> };
  let tasks: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    submitForReview: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    complete: ReturnType<typeof vi.fn>;
  };
  let discussion: { addEntry: ReturnType<typeof vi.fn> };
  let agents: { findById: ReturnType<typeof vi.fn> };
  let access: { requireAuthorizedTask: ReturnType<typeof vi.fn> };
  let handler: AgentTaskWriteHandler;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.workSpace.findUnique.mockResolvedValue({
      id: 'ws-a',
      name: 'Alpha',
      type: 'STANDALONE_OPERATIONAL',
      projectId: null,
      productId: null,
      extensionId: null,
      scrumEnabled: false,
    });
    policy = { assertAllowed: vi.fn().mockResolvedValue({ outcome: 'ALLOW' }) };
    tasks = {
      create: vi.fn().mockResolvedValue(TASK),
      update: vi.fn().mockResolvedValue({ ...TASK, title: 'Renamed' }),
      start: vi.fn().mockResolvedValue({ ...TASK, status: 'IN_PROGRESS' }),
      submitForReview: vi.fn().mockResolvedValue({ ...TASK, status: 'REVIEW' }),
      delete: vi.fn(),
      complete: vi.fn(),
    };
    discussion = {
      addEntry: vi.fn().mockResolvedValue({
        id: 'entry-1',
        createdAt: new Date('2026-08-21T00:00:00.000Z'),
      }),
    };
    agents = { findById: vi.fn().mockResolvedValue({ ownerId: 'owner-1' }) };
    access = {
      requireAuthorizedTask: vi.fn().mockResolvedValue({
        task: TASK,
        workspace: { id: 'ws-a', productId: null, projectId: null },
      }),
    };
    handler = new AgentTaskWriteHandler(
      prisma as never,
      policy as never,
      tasks as never,
      discussion as never,
      agents as never,
      access as never,
    );
  });

  it('creates through TasksService with agent provenance and the owner as accountable creator', async () => {
    await handler.create(agent(), { workspaceId: 'ws-a', title: 'Fix race' });
    expect(tasks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Fix race',
        workspaceId: 'ws-a',
        creatorId: 'owner-1',
      }),
      { type: 'EXTERNAL_AGENT', id: 'agent-1' },
      undefined,
    );
    expect(tasks.create.mock.calls[0]?.[0]).not.toHaveProperty('createdByActorType');
    expect(prisma.task.create).not.toHaveBeenCalled();
  });

  it('denies create when policy refuses', async () => {
    policy.assertAllowed.mockRejectedValue(
      AgentAccessException.fromDenyReason('CAPABILITY_NOT_GRANTED'),
    );
    await expect(
      handler.create(agent(), { workspaceId: 'ws-a', title: 'Fix' }),
    ).rejects.toMatchObject({ code: 'AGENT_CAPABILITY_DENIED' });
    expect(tasks.create).not.toHaveBeenCalled();
  });

  it('updates only allowlisted fields', async () => {
    const created = await handler.create(agent(), { workspaceId: 'ws-a', title: 'Fix race' });
    expect(created.updatedAt).toBe(TASK.updatedAt.toISOString());
    await handler.update(agent(), {
      taskId: 'task-1',
      title: 'Renamed',
      expectedUpdatedAt: created.updatedAt ?? TASK.updatedAt.toISOString(),
    });
    expect(tasks.update).toHaveBeenCalledWith(
      'task-1',
      { title: 'Renamed' },
      undefined,
      TASK.updatedAt,
      undefined,
    );
  });

  it('requires expectedUpdatedAt so a newer human edit cannot be overwritten silently', async () => {
    await expect(
      handler.update(agent(), { taskId: 'task-1', title: 'Renamed' }),
    ).rejects.toMatchObject({ code: 'AGENT_VALIDATION_FAILED' });
    expect(tasks.update).not.toHaveBeenCalled();
  });

  it('forwards expectedUpdatedAt to Tasks as an atomic predicate', async () => {
    const stale = new Date('2020-01-01T00:00:00.000Z');
    tasks.update.mockRejectedValue(
      new ConflictException('The task has changed since it was last read.'),
    );
    await expect(
      handler.update(agent(), {
        taskId: 'task-1',
        title: 'Renamed',
        expectedUpdatedAt: stale.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tasks.update).toHaveBeenCalledWith(
      'task-1',
      { title: 'Renamed' },
      undefined,
      stale,
      undefined,
    );
  });

  it('rejects starting a completed task without calling complete', async () => {
    access.requireAuthorizedTask.mockResolvedValue({
      task: { ...TASK, status: 'COMPLETED' },
      workspace: { id: 'ws-a' },
    });
    tasks.start.mockRejectedValue(new BadRequestException('Cannot start a completed task'));
    await expect(handler.start(agent(), { taskId: 'task-1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tasks.start).toHaveBeenCalledWith('task-1', undefined, undefined);
    expect(tasks.complete).not.toHaveBeenCalled();
  });

  it('comments with the agent ActorContext', async () => {
    await handler.comment(agent(), { taskId: 'task-1', body: 'Working' });
    expect(discussion.addEntry).toHaveBeenCalledWith(
      'task-1',
      expect.objectContaining({ actor: expect.objectContaining({ type: 'EXTERNAL_AGENT' }) }),
      'Working',
      undefined,
      undefined,
    );
  });

  it('maps submit_review to TasksService.submitForReview', async () => {
    const result = await handler.submitReview(agent(), { taskId: 'task-1' });
    expect(tasks.submitForReview).toHaveBeenCalledWith('task-1', undefined, undefined, undefined);
    expect(result.status).toBe('REVIEW');
    expect(tasks.complete).not.toHaveBeenCalled();
    expect(tasks.delete).not.toHaveBeenCalled();
  });

  it('rejects submit_review on a completed task without calling complete', async () => {
    access.requireAuthorizedTask.mockResolvedValue({
      task: { ...TASK, status: 'COMPLETED' },
      workspace: { id: 'ws-a' },
    });
    tasks.submitForReview.mockRejectedValue(
      new BadRequestException('Completed tasks cannot be submitted for review.'),
    );
    await expect(handler.submitReview(agent(), { taskId: 'task-1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tasks.submitForReview).toHaveBeenCalledWith('task-1', undefined, undefined, undefined);
    expect(tasks.complete).not.toHaveBeenCalled();
  });

  it('does not forward guessed entity links or assignment on create', async () => {
    const input: Record<string, unknown> = {
      workspaceId: 'ws-a',
      title: 'Fix race',
      links: [{ entityType: 'INVOICE', entityId: 'inv-1' }],
      assigneeId: 'emp-other',
    };
    await handler.create(agent(), input);
    expect(tasks.create).toHaveBeenCalledWith(
      expect.not.objectContaining({
        links: expect.anything(),
        assigneeId: expect.anything(),
      }),
      expect.anything(),
      undefined,
    );
  });

  it('does not call TasksService.complete or delete from any write path', async () => {
    await handler.start(agent(), { taskId: 'task-1' });
    await handler.submitReview(agent(), { taskId: 'task-1' });
    expect(tasks.complete).not.toHaveBeenCalled();
    expect(tasks.delete).not.toHaveBeenCalled();
  });
});
