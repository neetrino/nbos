// @vitest-environment jsdom

import { act, createElement, useEffect, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MESSENGER_WS_CLIENT_LEAVE_CONVERSATION,
  MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION,
  MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED,
  MESSENGER_WS_SERVER_CONVERSATION_MESSAGE,
} from '@nbos/shared';
import { messengerCoreApi, type MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import type { MessengerMessagesPage } from '@/features/messenger/query/messenger-cache';
import { tasksApi, type TaskDiscussionList } from '@/lib/api/tasks';
import { MessengerRealtimeHub } from '@/features/messenger/realtime/messenger-realtime-hub';
import type { MessengerClientSocket } from '@/features/messenger/realtime/messenger-socket-client';
import { useTaskDiscussion } from './use-task-discussion';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

vi.mock('@/lib/permissions/PermissionContext', () => ({
  usePermission: () => ({
    me: { id: 'emp-1' },
    can: (action: string, module: string) => action === 'VIEW' && module === 'MESSENGER',
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

type Emit = { event: string; payload: unknown; ack?: (response: unknown) => void };
type Listener = (...args: unknown[]) => void;
type DiscussionView = ReturnType<typeof useTaskDiscussion>;

const CONVERSATION_ID = 'conv-task';
const PAGE: TaskDiscussionList = {
  conversationId: CONVERSATION_ID,
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

describe('task discussion realtime', () => {
  let harness: ReturnType<typeof createTaskHarness>;
  let queryClient: QueryClient;
  let mounted: { unmount: () => void } | null = null;

  beforeEach(() => {
    vi.mocked(tasksApi.listDiscussion).mockReset().mockResolvedValue(PAGE);
    vi.mocked(tasksApi.addDiscussion).mockReset();
    vi.spyOn(messengerCoreApi, 'markRead').mockResolvedValue(undefined);
    const reactGlobals = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean;
    };
    reactGlobals.IS_REACT_ACT_ENVIRONMENT = true;
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    harness = createTaskHarness();
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
    vi.restoreAllMocks();
  });

  it('subscribes while discussion is open and leaves when it closes', async () => {
    const view = mountDiscussion(queryClient, true);
    mounted = view;
    await waitFor(() => view.current?.messages.some((row) => row.id === 'msg-1') ?? false);
    ackSubscribes(harness.emits);
    expect(eventPayloads(harness.emits, MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION)).toEqual([
      { conversationId: CONVERSATION_ID },
    ]);
    expect(messengerCoreApi.markRead).not.toHaveBeenCalled();
    await view.setOpen(false);
    expect(eventPayloads(harness.emits, MESSENGER_WS_CLIENT_LEAVE_CONVERSATION)).toEqual([
      { conversationId: CONVERSATION_ID },
    ]);
  });

  it('keeps the room when Messenger still retains the same conversation', async () => {
    const releaseMessenger = harness.hub.retainConversation(CONVERSATION_ID);
    ackSubscribes(harness.emits);
    const view = mountDiscussion(queryClient, true);
    mounted = view;
    await waitFor(() => view.current?.messages.some((row) => row.id === 'msg-1') ?? false);
    expect(eventPayloads(harness.emits, MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION)).toHaveLength(
      1,
    );
    await view.setOpen(false);
    expect(eventPayloads(harness.emits, MESSENGER_WS_CLIENT_LEAVE_CONVERSATION)).toHaveLength(0);
    releaseMessenger();
    expect(eventPayloads(harness.emits, MESSENGER_WS_CLIENT_LEAVE_CONVERSATION)).toEqual([
      { conversationId: CONVERSATION_ID },
    ]);
  });

  it('shows a socket message in the cache Task discussion already observes', async () => {
    const view = mountDiscussion(queryClient, true);
    mounted = view;
    await waitFor(() => view.current?.messages.some((row) => row.id === 'msg-1') ?? false);
    ackSubscribes(harness.emits);
    await act(async () => {
      harness.fire(MESSENGER_WS_SERVER_CONVERSATION_MESSAGE, {
        conversationId: CONVERSATION_ID,
        message: liveMessage(),
      });
    });
    const cached = queryClient.getQueryData<MessengerMessagesPage>(
      messengerQueryKeys.messages(CONVERSATION_ID),
    );
    expect(cached?.items.map((row) => row.id)).toEqual(['msg-1', 'msg-live']);
    await waitFor(() => view.current?.messages.some((row) => row.id === 'msg-live') ?? false);
    expect(view.current?.messages.map((row) => [row.id, row.body])).toEqual([
      ['msg-1', 'Existing'],
      ['msg-live', 'From messenger'],
    ]);
  });

  it('clears a revoked open thread and does not keep a writable composer', async () => {
    const view = mountDiscussion(queryClient, true);
    mounted = view;
    await waitFor(() => view.current?.messages.some((row) => row.id === 'msg-1') ?? false);
    ackSubscribes(harness.emits);
    await act(async () => {
      harness.fire(MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED, {
        conversationId: CONVERSATION_ID,
        zone: 'INTERNAL',
      });
    });
    expect(view.current?.composerDisabled).toBe(true);
    expect(view.current?.messages).toEqual([]);
    expect(eventPayloads(harness.emits, MESSENGER_WS_CLIENT_LEAVE_CONVERSATION)).toEqual([
      { conversationId: CONVERSATION_ID },
    ]);
    view.current?.send('should not post');
    expect(tasksApi.addDiscussion).not.toHaveBeenCalled();
  });

  it('does not subscribe or list discussion while the sheet discussion is closed', async () => {
    mounted = mountDiscussion(queryClient, false);
    await act(async () => undefined);
    expect(eventPayloads(harness.emits, MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION)).toHaveLength(
      0,
    );
    expect(tasksApi.listDiscussion).not.toHaveBeenCalled();
  });
});

function createTaskHarness() {
  const handlers = new Map<string, Listener[]>();
  const emits: Emit[] = [];
  const transport = createTaskTransport(handlers, emits);
  const hub = new MessengerRealtimeHub({
    connect: () => transport.socket,
    recoverSession: async () => ({ kind: 'available', accessToken: 'tok' }),
    recoverZone: async () => undefined,
  });
  return { hub, emits, connect: transport.connect, fire: transport.fire };
}

function createTaskTransport(handlers: Map<string, Listener[]>, emits: Emit[]) {
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
    emit(event, ...args) {
      emits.push({ event, payload: args[0], ack: readAck(args[1]) });
    },
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

function mountDiscussion(queryClient: QueryClient, open: boolean) {
  const container = document.createElement('div');
  const root = createRoot(container);
  const publishedRef: { current: DiscussionView | null; setOpen: (open: boolean) => void } = {
    current: null,
    setOpen: () => undefined,
  };
  act(() => {
    root.render(createElement(QueryClientProvider, { client: queryClient }, createElement(Screen)));
  });
  return {
    get current() {
      return publishedRef.current;
    },
    async setOpen(next: boolean) {
      await act(async () => {
        publishedRef.setOpen(next);
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
      publishedRef.setOpen = setOpen;
      publishedRef.current = discussion;
    }, [discussion, setOpen]);
    return null;
  }
}

async function waitFor(ready: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (ready()) return;
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 10);
      });
    });
  }
  throw new Error('timed out waiting for task discussion');
}

function ackSubscribes(emits: Emit[]): void {
  for (const item of emits) {
    if (item.event === MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION) item.ack?.({ ok: true });
  }
}

function eventPayloads(emits: Emit[], event: string): unknown[] {
  return emits.filter((item) => item.event === event).map((item) => item.payload);
}

function liveMessage(): MessengerCoreMessageRow {
  return {
    id: 'msg-live',
    conversationId: CONVERSATION_ID,
    senderId: 'emp-2',
    senderName: 'Grace',
    content: 'From messenger',
    createdAt: '2026-09-11T12:01:00.000Z',
    editedAt: null,
    attachments: [],
  };
}

function readAck(value: unknown): ((response: unknown) => void) | undefined {
  return typeof value === 'function' ? (value as (response: unknown) => void) : undefined;
}
