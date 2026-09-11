import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import type { MessengerMessagesPage } from '@/features/messenger/query/messenger-cache';
import { discussionEntryToCoreMessage } from './discussion-entry-to-core-message';
import { seedTaskDiscussionMessages } from './seed-task-discussion-messages';

describe('Task discussion message cache convergence', () => {
  it('writes Task notes into the shared messenger messages key', () => {
    const queryClient = new QueryClient();
    const conversationId = 'conv-task';
    seedTaskDiscussionMessages(queryClient, {
      conversationId,
      items: [
        {
          id: 'm1',
          body: 'Note',
          authorActorType: 'USER',
          authorActorId: 'e1',
          authorDisplayName: 'Ada',
          channelSource: 'web',
          createdAt: '2026-09-05T12:00:00.000Z',
          conversationId,
        },
      ],
      meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
    });
    const page = queryClient.getQueryData<MessengerMessagesPage>(
      messengerQueryKeys.messages(conversationId),
    );
    expect(page?.items).toEqual([
      discussionEntryToCoreMessage(conversationId, {
        id: 'm1',
        body: 'Note',
        authorActorType: 'USER',
        authorActorId: 'e1',
        authorDisplayName: 'Ada',
        channelSource: 'web',
        createdAt: '2026-09-05T12:00:00.000Z',
        conversationId,
      }),
    ]);
    expect(page?.meta.hasMoreOlder).toBe(false);
  });

  it('marks a latest Task page incomplete when total exceeds pageSize', () => {
    const queryClient = new QueryClient();
    seedTaskDiscussionMessages(queryClient, {
      conversationId: 'conv-task',
      items: [
        {
          id: 'm-latest',
          body: 'Latest',
          authorActorType: 'USER',
          authorActorId: 'e1',
          authorDisplayName: 'Ada',
          channelSource: 'web',
          createdAt: '2026-09-05T12:00:00.000Z',
        },
      ],
      meta: { total: 25, page: 1, pageSize: 20, totalPages: 2 },
    });
    const page = queryClient.getQueryData<MessengerMessagesPage>(
      messengerQueryKeys.messages('conv-task'),
    );
    expect(page?.meta.hasMoreOlder).toBe(true);
  });

  it('marks a later Task page incomplete when page is greater than 1', () => {
    const queryClient = new QueryClient();
    seedTaskDiscussionMessages(queryClient, {
      conversationId: 'conv-task',
      items: [
        {
          id: 'm-old',
          body: 'Older',
          authorActorType: 'USER',
          authorActorId: 'e1',
          authorDisplayName: 'Ada',
          channelSource: 'web',
          createdAt: '2026-09-04T12:00:00.000Z',
        },
      ],
      meta: { total: 20, page: 2, pageSize: 10, totalPages: 2 },
    });
    const page = queryClient.getQueryData<MessengerMessagesPage>(
      messengerQueryKeys.messages('conv-task'),
    );
    expect(page?.meta.hasMoreOlder).toBe(true);
  });

  it('does not overwrite known Messenger pagination metadata with weaker Task metadata', () => {
    const queryClient = new QueryClient();
    const conversationId = 'conv-task';
    queryClient.setQueryData<MessengerMessagesPage>(messengerQueryKeys.messages(conversationId), {
      items: [
        discussionEntryToCoreMessage(conversationId, {
          id: 'm1',
          body: 'Existing',
          authorActorType: 'USER',
          authorActorId: 'e1',
          authorDisplayName: 'Ada',
          channelSource: 'web',
          createdAt: '2026-09-05T11:00:00.000Z',
        }),
      ],
      meta: { hasMoreOlder: true },
    });
    seedTaskDiscussionMessages(queryClient, {
      conversationId,
      items: [
        {
          id: 'm2',
          body: 'Task page',
          authorActorType: 'USER',
          authorActorId: 'e1',
          authorDisplayName: 'Ada',
          channelSource: 'web',
          createdAt: '2026-09-05T12:00:00.000Z',
        },
      ],
      meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
    });
    const page = queryClient.getQueryData<MessengerMessagesPage>(
      messengerQueryKeys.messages(conversationId),
    );
    expect(page?.meta.hasMoreOlder).toBe(true);
    expect(page?.items.map((row) => row.id)).toEqual(['m1', 'm2']);
  });

  it('upgrades a pre-existing complete page when Task evidence has older pages', () => {
    const queryClient = new QueryClient();
    const conversationId = 'conv-task';
    queryClient.setQueryData<MessengerMessagesPage>(messengerQueryKeys.messages(conversationId), {
      items: [
        discussionEntryToCoreMessage(conversationId, {
          id: 'm-send',
          body: 'Sent first',
          authorActorType: 'USER',
          authorActorId: 'e1',
          authorDisplayName: 'Ada',
          channelSource: 'web',
          createdAt: '2026-09-05T12:00:00.000Z',
        }),
      ],
      meta: { hasMoreOlder: false },
    });
    seedTaskDiscussionMessages(queryClient, {
      conversationId,
      items: [
        {
          id: 'm-page',
          body: 'Latest page',
          authorActorType: 'USER',
          authorActorId: 'e1',
          authorDisplayName: 'Ada',
          channelSource: 'web',
          createdAt: '2026-09-05T12:01:00.000Z',
        },
      ],
      meta: { total: 25, page: 1, pageSize: 20, totalPages: 2 },
    });
    const page = queryClient.getQueryData<MessengerMessagesPage>(
      messengerQueryKeys.messages(conversationId),
    );
    expect(page?.meta.hasMoreOlder).toBe(true);
  });
});
