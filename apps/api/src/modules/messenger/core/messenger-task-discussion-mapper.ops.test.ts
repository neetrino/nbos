import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mapAllTaskDiscussionsToCore,
  mapTaskDiscussionToCore,
} from './messenger-task-discussion-mapper.ops';
import { taskCanonicalKey } from './messenger-core-canonical-key';
import { taskDiscussionEntryIdempotencyKey } from './messenger-task-discussion.metadata';

const TASK_ID = 'task-1';
const ensureTaskConversation = vi.fn();
const persistCoreMessage = vi.fn();

vi.mock('./messenger-core-task-ensure.ops', () => ({
  ensureTaskConversation: (...args: unknown[]) => ensureTaskConversation(...args),
}));

vi.mock('./messenger-core-message.ops', () => ({
  persistCoreMessage: (...args: unknown[]) => persistCoreMessage(...args),
}));

function entry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'entry-1',
    taskId: TASK_ID,
    body: 'First note',
    actorType: 'USER',
    actorId: 'emp-1',
    actorDisplayName: 'Ada Lovelace',
    channelSource: 'web',
    correlationId: 'corr-1',
    visibility: 'STANDARD',
    createdAt: new Date('2026-08-20T10:00:00.000Z'),
    ...overrides,
  };
}

describe('Task Discussion mapper', () => {
  let prisma: {
    taskDiscussionEntry: { groupBy: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
    task: { count: ReturnType<typeof vi.fn> };
    messengerLegacyIdentity: {
      findUnique: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    const messengerLegacyIdentity = {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn(),
    };
    prisma = {
      taskDiscussionEntry: {
        groupBy: vi.fn().mockResolvedValue([]),
        findMany: vi.fn().mockResolvedValue([]),
      },
      task: { count: vi.fn().mockResolvedValue(0) },
      messengerLegacyIdentity,
      $transaction: vi.fn(
        async (
          fn: (tx: { messengerLegacyIdentity: typeof messengerLegacyIdentity }) => Promise<unknown>,
        ) => fn({ messengerLegacyIdentity }),
      ),
    };
    ensureTaskConversation.mockReset().mockResolvedValue({
      id: 'conv-task',
      canonicalKey: taskCanonicalKey(TASK_ID),
    });
    persistCoreMessage.mockReset().mockResolvedValue({
      id: 'msg-1',
      createdAt: new Date('2026-08-20T10:00:00.000Z'),
    });
  });

  it('reports zero rows without creating a conversation', async () => {
    const report = await mapAllTaskDiscussionsToCore(prisma as never);
    expect(report.tasksWithDiscussion).toBe(0);
    expect(report.entriesMapped).toBe(0);
    expect(report.attachmentsSkipped).toBe(0);
    expect(ensureTaskConversation).not.toHaveBeenCalled();
  });

  it('maps an entry with original createdAt, actor provenance, and HIDDEN preserved', async () => {
    prisma.taskDiscussionEntry.findMany.mockResolvedValue([
      entry(),
      entry({
        id: 'entry-hidden',
        body: 'secret',
        actorType: 'EXTERNAL_AGENT',
        actorId: 'agent-1',
        actorDisplayName: 'Cursor Agent',
        visibility: 'HIDDEN',
        createdAt: new Date('2026-08-20T11:00:00.000Z'),
      }),
    ]);
    persistCoreMessage
      .mockResolvedValueOnce({ id: 'msg-1', createdAt: new Date('2026-08-20T10:00:00.000Z') })
      .mockResolvedValueOnce({ id: 'msg-2', createdAt: new Date('2026-08-20T11:00:00.000Z') });
    const report = await mapTaskDiscussionToCore(prisma as never, TASK_ID);
    expect(report.entriesMapped).toBe(2);
    expect(report.hiddenPreserved).toBe(1);
    expect(report.employeeActors).toBe(1);
    expect(report.agentActors).toBe(1);
    expect(persistCoreMessage.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        senderId: 'emp-1',
        createdAt: new Date('2026-08-20T10:00:00.000Z'),
        provenance: 'EMPLOYEE',
        idempotencyKey: taskDiscussionEntryIdempotencyKey('entry-1'),
      }),
    );
    expect(persistCoreMessage.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        senderId: null,
        provenance: 'AI',
        senderNameSnapshot: 'Cursor Agent',
        metadata: expect.objectContaining({
          taskDiscussion: expect.objectContaining({ visibility: 'HIDDEN' }),
        }),
      }),
    );
    expect(persistCoreMessage.mock.calls[0]?.[1].createdAt.getTime()).toBeLessThan(
      persistCoreMessage.mock.calls[1]?.[1].createdAt.getTime(),
    );
  });

  it('reruns without duplicating messages', async () => {
    prisma.taskDiscussionEntry.findMany.mockResolvedValue([entry()]);
    prisma.messengerLegacyIdentity.findUnique.mockResolvedValue({
      messageId: 'msg-1',
      conversationId: 'conv-task',
    });
    const report = await mapTaskDiscussionToCore(prisma as never, TASK_ID);
    expect(report.entriesSkippedExisting).toBe(1);
    expect(report.entriesMapped).toBe(0);
    expect(persistCoreMessage).not.toHaveBeenCalled();
  });

  it('reruns after persist-without-identity without a second message', async () => {
    prisma.taskDiscussionEntry.findMany.mockResolvedValue([entry()]);
    prisma.messengerLegacyIdentity.findUnique.mockResolvedValue(null);
    persistCoreMessage.mockResolvedValue({
      id: 'msg-existing',
      createdAt: new Date('2026-08-20T10:00:00.000Z'),
    });
    const first = await mapTaskDiscussionToCore(prisma as never, TASK_ID);
    expect(first.entriesMapped).toBe(1);
    expect(persistCoreMessage).toHaveBeenCalledTimes(1);
    expect(persistCoreMessage.mock.calls[0]?.[1].idempotencyKey).toBe(
      taskDiscussionEntryIdempotencyKey('entry-1'),
    );
    expect(prisma.messengerLegacyIdentity.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ messageId: 'msg-existing' }),
        update: expect.objectContaining({ messageId: 'msg-existing' }),
      }),
    );
    persistCoreMessage.mockClear();
    const second = await mapTaskDiscussionToCore(prisma as never, TASK_ID);
    expect(second.entriesMapped).toBe(1);
    expect(persistCoreMessage).toHaveBeenCalledTimes(1);
    expect(persistCoreMessage.mock.calls[0]?.[1].idempotencyKey).toBe(
      taskDiscussionEntryIdempotencyKey('entry-1'),
    );
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
