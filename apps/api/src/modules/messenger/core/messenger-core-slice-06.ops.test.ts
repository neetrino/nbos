import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createCoreMessageReference,
  deleteCoreMessageReference,
} from './messenger-core-reference.ops';
import { persistForwardHolderAndReferences } from './messenger-core-forward.ops';
import { attachTaskSourceReferences } from './messenger-core-task-source.ops';
import { loadOrderedSourceMessages } from './messenger-core-source-load';
import { persistCoreMessageMentions } from './messenger-core-mention.ops';
import { defaultTaskLinksFromPrimary } from './messenger-core-task-default-links';
import { sortCoreMessagesByCreatedAtId } from './messenger-core-message-order';
import { assertForwardTargetZone } from './messenger-core-reference-access';
import { MESSENGER_CORE_FORWARD_CLIENT_TARGET_FORBIDDEN } from './messenger-core.constants';
import { MessengerCoreActionsService } from './messenger-core-actions.service';

describe('Slice 6 message order', () => {
  it('sorts multi-select by createdAt asc then id', () => {
    const later = { id: 'a', createdAt: new Date('2026-08-31T12:00:00.000Z') };
    const earlier = { id: 'c', createdAt: new Date('2026-08-31T11:00:00.000Z') };
    const sameTimeLowerId = { id: 'b', createdAt: new Date('2026-08-31T12:00:00.000Z') };
    expect(
      sortCoreMessagesByCreatedAtId([later, earlier, sameTimeLowerId]).map((row) => row.id),
    ).toEqual(['c', 'a', 'b']);
  });
});

describe('Slice 6 mentions persist', () => {
  it('writes unique mention rows and does not add participants', async () => {
    const prisma = {
      employee: { findMany: vi.fn().mockResolvedValue([{ id: 'e2' }]) },
      messengerMessageMention: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
      messengerConversationParticipant: { create: vi.fn() },
    };
    const ids = await persistCoreMessageMentions(prisma as never, 'm1', ['e2', 'e2']);
    expect(ids).toEqual(['e2']);
    expect(prisma.messengerMessageMention.createMany).toHaveBeenCalledWith({
      data: [{ messageId: 'm1', employeeId: 'e2' }],
      skipDuplicates: true,
    });
    expect(prisma.messengerConversationParticipant.create).not.toHaveBeenCalled();
  });
});

describe('Slice 6 default Task links', () => {
  it('does not guess a Product when multiple PRODUCT PRIMARY links exist', () => {
    const links = defaultTaskLinksFromPrimary([
      { entityType: 'PRODUCT', entityId: 'p1', relationType: 'PRIMARY' },
      { entityType: 'PRODUCT', entityId: 'p2', relationType: 'PRIMARY' },
      { entityType: 'DEAL', entityId: 'd1', relationType: 'PRIMARY' },
    ]);
    expect(links).toEqual([{ entityType: 'DEAL', entityId: 'd1' }]);
  });
});

describe('Slice 6 reference create fields', () => {
  it('sets targetConversationId, createdById and sortOrder', async () => {
    const prisma = {
      messengerMessage: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ id: 'src-1', conversationId: 'conv-src' })
          .mockResolvedValueOnce({ conversationId: 'conv-hold' }),
      },
      messengerMessageReference: {
        create: vi.fn().mockResolvedValue({ id: 'ref-1', sourceMessageId: 'src-1' }),
      },
    };
    await createCoreMessageReference(prisma as never, {
      sourceMessageId: 'src-1',
      targetMessageId: 'hold-1',
      purpose: 'FORWARD',
      createdById: 'e1',
      sortOrder: 2,
    });
    expect(prisma.messengerMessageReference.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          targetConversationId: 'conv-hold',
          createdById: 'e1',
          sortOrder: 2,
          purpose: 'FORWARD',
        }),
      }),
    );
  });
});

describe('Slice 6 forward', () => {
  it('rejects Internal → Client forward', () => {
    expect(() => assertForwardTargetZone('CLIENT')).toThrow(ForbiddenException);
    expect(() => assertForwardTargetZone('CLIENT')).toThrow(
      MESSENGER_CORE_FORWARD_CLIENT_TARGET_FORBIDDEN,
    );
  });

  it('does not create a conversation or thread root', async () => {
    const prisma = {
      messengerMessage: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'src-1',
            conversationId: 'conv-src',
            content: 'hello world',
            createdAt: new Date('2026-08-31T10:00:00.000Z'),
          },
        ]),
        findUnique: vi.fn().mockImplementation(async (args: { where: { id?: string } }) => {
          if (args.where.id === 'src-1') return { id: 'src-1', conversationId: 'conv-src' };
          if (args.where.id === 'hold-1') return { conversationId: 'conv-target' };
          return null;
        }),
        create: vi.fn().mockResolvedValue({
          id: 'hold-1',
          conversationId: 'conv-target',
          senderId: 'e1',
          senderNameSnapshot: 'Ada',
          content: 'hello world',
          direction: 'INTERNAL',
          status: 'SENT',
          provenance: 'EMPLOYEE',
          replyToMessageId: null,
          threadRootMessageId: null,
          createdAt: new Date(),
          editedAt: null,
          attachments: [],
        }),
      },
      messengerConversation: {
        findUnique: vi.fn().mockResolvedValue({ id: 'conv-target', zone: 'INTERNAL' }),
        create: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
      messengerMessageReference: {
        create: vi.fn().mockResolvedValue({ id: 'ref-1', sourceMessageId: 'src-1' }),
      },
      messengerMessageMention: { createMany: vi.fn() },
      employee: {
        findUnique: vi.fn().mockResolvedValue({ firstName: 'Ada', lastName: 'L', email: 'a' }),
      },
    };
    const result = await persistForwardHolderAndReferences(prisma as never, {
      targetConversationId: 'conv-target',
      senderId: 'e1',
      sourceMessageIds: ['src-1'],
    });
    expect(result.createdConversation).toBe(false);
    expect(prisma.messengerConversation.create).not.toHaveBeenCalled();
    expect(prisma.messengerMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          threadRootMessageId: undefined,
          conversationId: 'conv-target',
        }),
      }),
    );
    expect(prisma.messengerMessageReference.create).toHaveBeenCalled();
  });
});

describe('Slice 6 Create Task sources', () => {
  it('keeps the source message and does not ensure a Task conversation', async () => {
    const prisma = {
      task: {
        findUnique: vi.fn().mockResolvedValue({ id: 'task-1', trashedAt: null }),
        update: vi.fn(),
      },
      messengerMessage: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'src-1',
            conversationId: 'conv-src',
            content: 'please do this',
            createdAt: new Date(),
          },
        ]),
        findUnique: vi.fn().mockResolvedValue({ id: 'src-1', conversationId: 'conv-src' }),
        delete: vi.fn(),
      },
      messengerMessageReference: {
        create: vi.fn().mockResolvedValue({ id: 'ref-1', sourceMessageId: 'src-1' }),
      },
      messengerConversation: { create: vi.fn() },
    };
    const result = await attachTaskSourceReferences(prisma as never, {
      sourceMessageIds: ['src-1'],
      taskId: 'task-1',
      createdById: 'e1',
    });
    expect(result.createdConversation).toBe(false);
    expect(result.sourceMessageIds).toEqual(['src-1']);
    expect(prisma.messengerMessage.delete).not.toHaveBeenCalled();
    expect(prisma.messengerConversation.create).not.toHaveBeenCalled();
    expect(prisma.task.update).not.toHaveBeenCalled();
    expect(prisma.messengerMessageReference.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          purpose: 'TASK_SOURCE',
          entityType: 'TASK',
          entityId: 'task-1',
          sortOrder: 0,
          createdById: 'e1',
        }),
      }),
    );
  });
});

describe('Slice 6 delete reference integrity', () => {
  it('deletes the reference without deleting the source message', async () => {
    const prisma = {
      messengerMessageReference: {
        findUnique: vi.fn().mockResolvedValue({ sourceMessageId: 'src-1' }),
        delete: vi.fn().mockResolvedValue({}),
      },
      messengerMessage: { delete: vi.fn() },
    };
    const result = await deleteCoreMessageReference(prisma as never, 'ref-1');
    expect(result.sourceMessageId).toBe('src-1');
    expect(prisma.messengerMessage.delete).not.toHaveBeenCalled();
  });
});

describe('Slice 6 ordered source load', () => {
  it('returns createdAt,id order for mixed ids', async () => {
    const prisma = {
      messengerMessage: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'b',
            conversationId: 'c1',
            content: '2',
            createdAt: new Date('2026-08-31T12:00:00Z'),
          },
          {
            id: 'a',
            conversationId: 'c1',
            content: '1',
            createdAt: new Date('2026-08-31T11:00:00Z'),
          },
        ]),
      },
    };
    const rows = await loadOrderedSourceMessages(prisma as never, ['b', 'a']);
    expect(rows.map((row) => row.id)).toEqual(['a', 'b']);
  });
});

describe('Slice 6 actions service negatives', () => {
  const prisma = {
    messengerMessageReference: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    messengerMessage: { findMany: vi.fn(), findUnique: vi.fn() },
    task: { findUnique: vi.fn() },
  };
  const core = {
    requireRead: vi.fn(),
    requireWrite: vi.fn(),
    requireEditAccess: vi.fn(),
  };
  const gateway = { emitCoreConversationMessage: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('open original 404s without source READ', async () => {
    prisma.messengerMessage.findUnique = vi.fn().mockResolvedValue({
      id: 'src-1',
      conversationId: 'conv-src',
      senderId: 'e1',
      senderNameSnapshot: 'Ada',
      content: 'secret',
      direction: 'INTERNAL',
      status: 'SENT',
      provenance: 'EMPLOYEE',
      replyToMessageId: null,
      threadRootMessageId: null,
      createdAt: new Date(),
      editedAt: null,
      deletedAt: null,
      attachments: [],
      mentions: [],
      referencesAsTarget: [],
      conversation: { zone: 'INTERNAL', type: 'TASK' },
    });
    core.requireRead.mockRejectedValue(new NotFoundException('Conversation not found'));
    const service = new MessengerCoreActionsService(
      prisma as never,
      core as never,
      gateway as never,
    );
    await expect(service.getSourceMessage('e1', 'src-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('forward into a conversation the caller cannot write is 403/404', async () => {
    core.requireWrite.mockRejectedValue(
      new ForbiddenException('Internal conversation write access is required'),
    );
    const service = new MessengerCoreActionsService(
      prisma as never,
      core as never,
      gateway as never,
    );
    await expect(service.forwardMessages('e1', 'conv-target', ['src-1'])).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(gateway.emitCoreConversationMessage).not.toHaveBeenCalled();
  });
});
