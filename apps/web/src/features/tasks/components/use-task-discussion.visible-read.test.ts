// @vitest-environment jsdom

import { act } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED,
  MESSENGER_WS_SERVER_CONVERSATION_MESSAGE,
} from '@nbos/shared';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { taskPendingConversationId } from '@/features/messenger/query/messenger-local-send';
import { tasksApi } from '@/lib/api/tasks';
import { MessengerRealtimeHub } from '@/features/messenger/realtime/messenger-realtime-hub';
import {
  advanceTaskReadWindow,
  createTaskReadHarness,
  hideTaskDocument,
  mountTaskDiscussion,
  readTaskUnread,
  seedTaskUnread,
  setTaskDocumentVisibility,
  settleTaskDiscussion,
  TASK_READ_CONVERSATION_ID,
  TASK_READ_PAGE,
  taskReadLiveMessage,
  type TaskReadMount,
} from './task-discussion-read.harness';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

let allowMessengerView = true;

vi.mock('@/lib/permissions/PermissionContext', () => ({
  usePermission: () => ({
    me: { id: 'emp-1' },
    can: (action: string, module: string) =>
      allowMessengerView && action === 'VIEW' && module === 'MESSENGER',
  }),
}));

vi.mock('@/lib/api/tasks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/tasks')>();
  return {
    ...actual,
    tasksApi: { ...actual.tasksApi, listDiscussion: vi.fn(), addDiscussion: vi.fn() },
  };
});

let activeHub: MessengerRealtimeHub | null = null;

vi.mock('@/features/messenger/realtime/MessengerRealtimeProvider', () => ({
  useMessengerRealtimeHub: () => {
    if (!activeHub) throw new Error('task discussion hub is not ready');
    return activeHub;
  },
}));

describe('task discussion visible read', () => {
  let harness: ReturnType<typeof createTaskReadHarness>;
  let queryClient: QueryClient;
  let mounted: TaskReadMount | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    allowMessengerView = true;
    setTaskDocumentVisibility('visible');
    vi.mocked(tasksApi.listDiscussion).mockReset().mockResolvedValue(TASK_READ_PAGE);
    vi.spyOn(messengerCoreApi, 'markRead').mockResolvedValue(undefined);
    const reactGlobals = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
    reactGlobals.IS_REACT_ACT_ENVIRONMENT = true;
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    harness = createTaskReadHarness();
    harness.hub.attachQueryClient(queryClient);
    activeHub = harness.hub;
    harness.hub.start('tok');
    harness.connect();
  });

  afterEach(() => {
    mounted?.unmount();
    mounted = null;
    harness.hub.stop();
    activeHub = null;
    allowMessengerView = true;
    setTaskDocumentVisibility('visible');
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('marks one visible open thread read after the coalesce window', async () => {
    seedTaskUnread(queryClient, 4);
    mounted = mountTaskDiscussion(queryClient, true);
    await settleLoaded();
    expect(messengerCoreApi.markRead).not.toHaveBeenCalled();
    await advanceTaskReadWindow();
    expect(messengerCoreApi.markRead).toHaveBeenCalledTimes(1);
    expect(messengerCoreApi.markRead).toHaveBeenCalledWith(TASK_READ_CONVERSATION_ID);
    expect(readTaskUnread(queryClient)).toBe(0);
  });

  it('coalesces a message burst into one read', async () => {
    mounted = mountTaskDiscussion(queryClient, true);
    await settleLoaded();
    await act(async () => {
      fireLive('msg-a', '2026-09-11T12:01:00.000Z');
      fireLive('msg-b', '2026-09-11T12:02:00.000Z');
      fireLive('msg-c', '2026-09-11T12:03:00.000Z');
    });
    expect(messengerCoreApi.markRead).not.toHaveBeenCalled();
    await advanceTaskReadWindow();
    expect(messengerCoreApi.markRead).toHaveBeenCalledTimes(1);
    expect(messengerCoreApi.markRead).toHaveBeenCalledWith(TASK_READ_CONVERSATION_ID);
  });

  it('does not mark read while the document is hidden', async () => {
    setTaskDocumentVisibility('hidden');
    mounted = mountTaskDiscussion(queryClient, true);
    await settleLoaded();
    await advanceTaskReadWindow();
    expect(messengerCoreApi.markRead).not.toHaveBeenCalled();
  });

  it('cancels a read when the document hides before the timer', async () => {
    mounted = mountTaskDiscussion(queryClient, true);
    await settleLoaded();
    await hideTaskDocument();
    await advanceTaskReadWindow();
    expect(messengerCoreApi.markRead).not.toHaveBeenCalled();
  });

  it('cancels a read when discussion closes before the timer', async () => {
    mounted = mountTaskDiscussion(queryClient, true);
    await settleLoaded();
    await mounted.setOpen(false);
    await advanceTaskReadWindow();
    expect(messengerCoreApi.markRead).not.toHaveBeenCalled();
  });

  it('does not mark a pending-only conversation id', async () => {
    vi.mocked(tasksApi.listDiscussion).mockResolvedValue({
      ...TASK_READ_PAGE,
      conversationId: taskPendingConversationId('task-1'),
    });
    mounted = mountTaskDiscussion(queryClient, true);
    await settleLoaded();
    await advanceTaskReadWindow();
    expect(messengerCoreApi.markRead).not.toHaveBeenCalled();
  });

  it('does not mark read when access is revoked before the timer', async () => {
    mounted = mountTaskDiscussion(queryClient, true);
    await settleLoaded();
    await act(async () => {
      harness.fire(MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED, {
        conversationId: TASK_READ_CONVERSATION_ID,
        zone: 'INTERNAL',
      });
    });
    await advanceTaskReadWindow();
    expect(messengerCoreApi.markRead).not.toHaveBeenCalled();
  });

  it('does not mark read without Messenger VIEW', async () => {
    allowMessengerView = false;
    mounted = mountTaskDiscussion(queryClient, true);
    await settleLoaded();
    await advanceTaskReadWindow();
    expect(messengerCoreApi.markRead).not.toHaveBeenCalled();
  });

  async function settleLoaded(): Promise<void> {
    await settleTaskDiscussion(
      () => mounted?.current?.messages.some((row) => row.id === 'msg-1') ?? false,
    );
  }

  function fireLive(id: string, createdAt: string): void {
    harness.fire(MESSENGER_WS_SERVER_CONVERSATION_MESSAGE, {
      conversationId: TASK_READ_CONVERSATION_ID,
      message: taskReadLiveMessage(id, createdAt),
    });
  }
});
