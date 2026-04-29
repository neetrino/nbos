'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePermission } from '@/lib/permissions/PermissionContext';
import { employeesApi } from '@/lib/api/employees';
import {
  messengerApi,
  type MessengerChannelRow,
  type MessengerDmConversationRow,
} from '@/lib/api/messenger';
import { MessengerSidebar } from './MessengerSidebar';
import { MessengerThread } from './MessengerThread';
import type { MessengerActiveView } from './messenger-active-view';
import {
  initialsFromDisplayName,
  mapMessengerRowToView,
  type MessengerViewMessage,
} from './messenger-message-mapper';
import { useMessengerRealtime } from './useMessengerRealtime';

export function MessengerClient() {
  const { me, isLoading: permsLoading, can } = usePermission();
  const canViewMessenger = can('VIEW', 'MESSENGER');
  const canEditMessenger = can('EDIT', 'MESSENGER');

  const [channels, setChannels] = useState<MessengerChannelRow[]>([]);
  const [conversations, setConversations] = useState<MessengerDmConversationRow[]>([]);
  const [peerNames, setPeerNames] = useState<Record<string, string>>({});
  const [active, setActive] = useState<MessengerActiveView | null>(null);
  const [messages, setMessages] = useState<MessengerViewMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendBusy, setSendBusy] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const activeRef = useRef(active);
  activeRef.current = active;

  const onInboundChannelMessage = useCallback((channelId: string, msg: MessengerViewMessage) => {
    setMessages((prev) => {
      const a = activeRef.current;
      if (a?.type !== 'channel' || a.id !== channelId) return prev;
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const onInboundDmMessage = useCallback((counterpartId: string, msg: MessengerViewMessage) => {
    setMessages((prev) => {
      const a = activeRef.current;
      if (a?.type !== 'dm' || a.userId !== counterpartId) return prev;
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const refreshDmSidebar = useCallback(() => {
    void (async () => {
      try {
        const convos = await messengerApi.listDmConversations();
        setConversations(convos);
      } catch {
        /* noop */
      }
    })();
  }, []);

  useMessengerRealtime({
    canViewMessenger,
    meId: me?.id,
    active,
    onInboundChannelMessage,
    onInboundDmMessage,
    onDmSidebarRefresh: refreshDmSidebar,
  });

  useEffect(() => {
    if (permsLoading || !me) return;
    if (!canViewMessenger) {
      setChannels([]);
      setConversations([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setBootError(null);
        const [ch, convos] = await Promise.all([
          messengerApi.listChannels(),
          messengerApi.listDmConversations(),
        ]);
        if (cancelled) return;
        setChannels(ch);
        setConversations(convos);
        setActive((prev) => {
          if (prev) return prev;
          if (ch[0]) return { type: 'channel', id: ch[0].id };
          if (convos[0]) return { type: 'dm', userId: convos[0].recipientId };
          return null;
        });
        try {
          const emps = await employeesApi.getAll({ page: 1, pageSize: 500 });
          if (cancelled) return;
          const map: Record<string, string> = {};
          for (const e of emps.items) {
            map[e.id] = `${e.firstName} ${e.lastName}`.trim() || e.email;
          }
          setPeerNames(map);
        } catch {
          if (!cancelled) setPeerNames({});
        }
      } catch (e) {
        if (!cancelled) {
          setBootError(e instanceof Error ? e.message : 'Failed to load messenger');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [permsLoading, me, canViewMessenger]);

  useEffect(() => {
    if (!canViewMessenger || !me || !active) return;
    let cancelled = false;
    (async () => {
      setMessagesLoading(true);
      setListError(null);
      try {
        if (active.type === 'channel') {
          const res = await messengerApi.listChannelMessages(active.id);
          if (!cancelled) setMessages(res.items.map(mapMessengerRowToView));
        } else {
          const res = await messengerApi.listDirectMessages(me.id, active.userId);
          if (!cancelled) setMessages(res.items.map(mapMessengerRowToView));
        }
      } catch (e) {
        if (!cancelled) {
          setListError(e instanceof Error ? e.message : 'Failed to load messages');
          setMessages([]);
        }
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, me, canViewMessenger]);

  async function handleSend() {
    if (!canEditMessenger || !me || !active || !newMessage.trim() || sendBusy) return;
    const text = newMessage.trim();
    setSendBusy(true);
    setNewMessage('');
    try {
      if (active.type === 'channel') {
        await messengerApi.sendChannelMessage(active.id, { content: text });
        const res = await messengerApi.listChannelMessages(active.id);
        setMessages(res.items.map(mapMessengerRowToView));
      } else {
        await messengerApi.sendDirectMessage({ recipientId: active.userId, content: text });
        const res = await messengerApi.listDirectMessages(me.id, active.userId);
        setMessages(res.items.map(mapMessengerRowToView));
        const convos = await messengerApi.listDmConversations();
        setConversations(convos);
      }
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'Send failed');
      setNewMessage(text);
    } finally {
      setSendBusy(false);
    }
  }

  if (permsLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center rounded-2xl border border-black/[0.06] bg-[#F5F5F0]">
        <p className="text-sm text-black/50">Loading…</p>
      </div>
    );
  }

  if (!canViewMessenger) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center rounded-2xl border border-black/[0.06] bg-[#F5F5F0]">
        <p className="text-sm text-black/60">You do not have permission to view Messenger.</p>
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center rounded-2xl border border-black/[0.06] bg-[#F5F5F0]">
        <p className="text-sm text-red-600">{bootError}</p>
      </div>
    );
  }

  const dmPeers = conversations.map((c) => {
    const resolved = peerNames[c.recipientId];
    const fallback = `Colleague (${c.recipientId.slice(0, 8)}…)`;
    const name = resolved ?? fallback;
    return {
      id: c.recipientId,
      name,
      initials: initialsFromDisplayName(resolved ?? c.recipientId),
      online: false,
    };
  });

  const channelSidebarItems = channels.map((c) => ({
    id: c.id,
    listLabel: c.name.startsWith('#') ? c.name : `#${c.name}`,
  }));

  const channelRow =
    active?.type === 'channel' ? channels.find((c) => c.id === active.id) : undefined;
  const dmPeer = active?.type === 'dm' ? dmPeers.find((p) => p.id === active.userId) : undefined;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-[#F5F5F0]">
      {listError ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-xs text-red-800">
          {listError}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1">
        <MessengerSidebar
          channels={channelSidebarItems}
          dmPeers={dmPeers}
          active={active}
          onSelect={setActive}
          search={search}
          onSearchChange={setSearch}
        />
        {!active ? (
          <div className="flex flex-1 items-center justify-center bg-white">
            <p className="text-sm text-black/40">Select a channel or conversation.</p>
          </div>
        ) : (
          <MessengerThread
            active={active}
            channelRow={channelRow}
            dmTitle={active.type === 'dm' ? (dmPeer?.name ?? active.userId) : ''}
            dmInitials={active.type === 'dm' ? (dmPeer?.initials ?? '?') : ''}
            messages={messages}
            messagesLoading={messagesLoading}
            newMessage={newMessage}
            onNewMessageChange={setNewMessage}
            onSend={() => {
              void handleSend();
            }}
            canSend={canEditMessenger}
            sendDisabled={!newMessage.trim() || sendBusy}
          />
        )}
      </div>
    </div>
  );
}
