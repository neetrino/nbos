import { act, createElement, useEffect, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import { MESSENGER_VISIBLE_READ_COALESCE_MS } from '@/features/messenger/query/messenger-visible-read';
import { MessengerRealtimeHub } from '@/features/messenger/realtime/messenger-realtime-hub';
import type { MessengerClientSocket } from '@/features/messenger/realtime/messenger-socket-client';
import type { TaskDiscussionList } from '@/lib/api/tasks';
import { useTaskDiscussion } from './use-task-discussion';

export const TASK_READ_CONVERSATION_ID = 'conv-task';

export const TASK_READ_PAGE: TaskDiscussionList = {
  conversationId: TASK_READ_CONVERSATION_ID,
  items: [
    {
      id: 'msg-1',
      body: 'Existing',
      authorActorType: 'USER',
      authorActorId: 'emp-1',
      authorDisplayName: 'Ada',
      channelSource: 'web',
      createdAt: '2026-09-11T12:00:00.000Z',
    },
  ],
  meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
};

export type TaskReadMount = {
  current: ReturnType<typeof useTaskDiscussion> | null;
  setOpen: (open: boolean) => Promise<void>;
  unmount: () => void;
};

type Listener = (...args: unknown[]) => void;

export function createTaskReadHarness() {
  const handlers = new Map<string, Listener[]>();
  const transport = createTaskReadTransport(handlers);
  const hub = new MessengerRealtimeHub({
    connect: () => transport.socket,
    recoverSession: async () => ({ kind: 'available', accessToken: 'tok' }),
    recoverZone: async () => undefined,
  });
  return { hub, fire: transport.fire, connect: transport.connect };
}

export function mountTaskDiscussion(queryClient: QueryClient, open: boolean): TaskReadMount {
  const root = createRoot(document.createElement('div'));
  const published: { current: TaskReadMount['current']; setOpen: (open: boolean) => void } = {
    current: null,
    setOpen: () => undefined,
  };
  act(() => {
    root.render(createElement(QueryClientProvider, { client: queryClient }, createElement(Screen)));
  });
  return {
    get current() {
      return published.current;
    },
    async setOpen(next: boolean) {
      await act(async () => {
        published.setOpen(next);
      });
    },
    unmount() {
      act(() => root.unmount());
    },
  };

  function Screen(): ReactNode {
    const [isOpen, setOpen] = useState(open);
    const discussion = useTaskDiscussion('task-1', isOpen);
    useEffect(() => {
      published.setOpen = setOpen;
      published.current = discussion;
    }, [discussion]);
    return null;
  }
}

export function seedTaskUnread(queryClient: QueryClient, unreadCount: number): void {
  queryClient.setQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' }), {
    items: [
      {
        id: TASK_READ_CONVERSATION_ID,
        zone: 'INTERNAL' as const,
        type: 'TASK' as const,
        title: 'Task',
        status: 'ACTIVE',
        canonicalKey: 'task:task-1',
        createdAt: '2026-09-11T10:00:00.000Z',
        lastMessageAt: '2026-09-11T12:00:00.000Z',
        unreadCount,
        canWrite: true,
      },
    ],
  });
}

export function readTaskUnread(queryClient: QueryClient): number | undefined {
  const page = queryClient.getQueryData<{ items: Array<{ unreadCount?: number }> }>(
    messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
  );
  return page?.items[0]?.unreadCount;
}

export async function advanceTaskReadWindow(): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(MESSENGER_VISIBLE_READ_COALESCE_MS);
  });
}

export async function hideTaskDocument(): Promise<void> {
  await act(async () => {
    setTaskDocumentVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

export function setTaskDocumentVisibility(state: 'hidden' | 'visible'): void {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
}

export async function settleTaskDiscussion(ready: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (ready()) return;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
  }
  throw new Error('timed out waiting for task discussion');
}

export function taskReadLiveMessage(id: string, createdAt: string): MessengerCoreMessageRow {
  return {
    id,
    conversationId: TASK_READ_CONVERSATION_ID,
    senderId: 'emp-2',
    senderName: 'Grace',
    content: 'From messenger',
    createdAt,
    editedAt: null,
    attachments: [],
  };
}

function createTaskReadTransport(handlers: Map<string, Listener[]>) {
  let connected = false;
  const socket: MessengerClientSocket = {
    get connected() {
      return connected;
    },
    on(event, listener) {
      const list = handlers.get(event) ?? [];
      list.push(listener);
      handlers.set(event, list);
    },
    emit() {},
    close() {
      connected = false;
    },
    removeAllListeners() {
      handlers.clear();
    },
    io: { on() {} },
  };
  return {
    socket,
    connect() {
      connected = true;
      for (const listener of handlers.get('connect') ?? []) listener();
    },
    fire(event: string, payload: unknown) {
      for (const listener of handlers.get(event) ?? []) listener(payload);
    },
  };
}
