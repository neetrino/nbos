import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import type { MessengerMessagesPage } from '@/features/messenger/query/messenger-cache';
import { sendTaskDiscussionNote } from './use-task-discussion';
import { tasksApi, type TaskDiscussionEntry } from '@/lib/api/tasks';

vi.mock('@/lib/api/tasks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/tasks')>();
  return {
    ...actual,
    tasksApi: {
      ...actual.tasksApi,
      addDiscussion: vi.fn(),
    },
  };
});

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

const addDiscussion = vi.mocked(tasksApi.addDiscussion);

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const SUMMARY: MessengerCoreConversationRow = {
  id: 'conv-task',
  zone: 'INTERNAL',
  type: 'TASK',
  title: 'Ship cache fix',
  status: 'ACTIVE',
  canonicalKey: 'task:task-1',
  createdAt: '2026-09-11T10:00:00.000Z',
  lastMessageAt: '2026-09-11T12:00:00.000Z',
  lastMessagePreview: 'First note',
  unreadCount: 0,
  peerEmployeeId: null,
  peerName: null,
  isFavorite: false,
  canWrite: true,
};

const ENTRY: TaskDiscussionEntry = {
  id: 'msg-1',
  body: 'First note',
  authorActorType: 'USER',
  authorActorId: 'emp-1',
  authorDisplayName: 'Ada Lovelace',
  channelSource: 'web',
  createdAt: '2026-09-11T12:00:00.000Z',
  conversationId: 'conv-task',
  conversation: SUMMARY,
};

describe('sendTaskDiscussionNote inbox reconciliation', () => {
  const allKey = messengerQueryKeys.internalSummaries({ source: 'all-dataset' });

  beforeEach(() => {
    addDiscussion.mockReset().mockResolvedValue(ENTRY);
  });

  it('upserts the returned Task summary into a fresh inbox without a list refetch', async () => {
    const queryClient = createClient();
    queryClient.setQueryData(allKey, { items: [] });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    await sendTaskDiscussionNote(queryClient, 'task-1', null, 'First note');
    const items =
      queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(allKey)?.items ?? [];
    expect(items.map((row) => row.id)).toEqual(['conv-task']);
    expect(items[0]?.lastMessagePreview).toBe('First note');
    expect(items[0]?.unreadCount).toBe(0);
    const thread = queryClient.getQueryData<MessengerMessagesPage>(
      messengerQueryKeys.messages('conv-task'),
    );
    expect(thread?.items.map((row) => row.id)).toEqual(['msg-1']);
    expect(invalidate).not.toHaveBeenCalled();
    expect(addDiscussion).toHaveBeenCalledWith('task-1', 'First note');
  });
});
