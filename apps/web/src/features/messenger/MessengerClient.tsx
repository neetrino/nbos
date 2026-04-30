'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MESSENGER_TYPING_EMIT_MIN_MS,
  type MessengerWsChannelPeerReadPayload,
  type MessengerWsDmPeerReadPayload,
} from '@nbos/shared';
import { usePermission } from '@/lib/permissions/PermissionContext';
import { employeesApi } from '@/lib/api/employees';
import {
  messengerApi,
  type MessengerChannelRow,
  type MessengerDmConversationRow,
  type MessengerSearchResultRow,
} from '@/lib/api/messenger';
import { MessengerSidebar } from './MessengerSidebar';
import { MessengerThread } from './MessengerThread';
import type { MessengerActiveView } from './messenger-active-view';
import {
  initialsFromDisplayName,
  mapMessengerRowToView,
  type MessengerViewMessage,
} from './messenger-message-mapper';
import { dmReadReceiptMessageId as computeDmReadReceiptMessageId } from './messenger-dm-read-receipt.util';
import { MESSENGER_REMOTE_TYPING_HINT_MS } from './messenger-typing-ui.constants';
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
  const [attachmentDraft, setAttachmentDraft] = useState('');
  const [zone, setZone] = useState<'internal' | 'external'>('internal');
  const [searchResults, setSearchResults] = useState<MessengerSearchResultRow[]>([]);
  const [remoteTypingHint, setRemoteTypingHint] = useState<string | null>(null);
  const [onlineInMessengerById, setOnlineInMessengerById] = useState<Record<string, true>>({});
  const [dmPeerLastReadAt, setDmPeerLastReadAt] = useState<string | null>(null);
  const [channelReadReceipt, setChannelReadReceipt] = useState<{
    seen: boolean;
    anchorId: string | null;
  }>({ seen: false, anchorId: null });

  const typingClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLocalTypingEmitRef = useRef(0);

  const activeRef = useRef(active);
  activeRef.current = active;

  const refreshMessengerLists = useCallback(() => {
    void (async () => {
      try {
        const [ch, convos] = await Promise.all([
          messengerApi.listChannels(),
          messengerApi.listDmConversations(),
        ]);
        setChannels(ch);
        setConversations(convos);
      } catch {
        /* noop */
      }
    })();
  }, []);

  const refreshChannelMessages = useCallback(() => {
    void (async () => {
      const a = activeRef.current;
      if (a?.type !== 'channel') return;
      try {
        const res = await messengerApi.listChannelMessages(a.id);
        setMessages(res.items.map(mapMessengerRowToView));
        setChannelReadReceipt({
          seen: res.lastOwnMessageSeenByOthers,
          anchorId: res.lastOwnMessageId,
        });
      } catch {
        /* noop */
      }
    })();
  }, []);

  const onChannelPeerRead = useCallback(
    (p: MessengerWsChannelPeerReadPayload) => {
      const a = activeRef.current;
      if (a?.type !== 'channel' || a.id !== p.channelId) return;
      refreshChannelMessages();
    },
    [refreshChannelMessages],
  );

  const onInboundChannelMessage = useCallback(
    (channelId: string, msg: MessengerViewMessage) => {
      setMessages((prev) => {
        const a = activeRef.current;
        if (a?.type !== 'channel' || a.id !== channelId) return prev;
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      void (async () => {
        const a = activeRef.current;
        if (a?.type === 'channel' && a.id === channelId) {
          try {
            await messengerApi.markChannelRead(channelId);
          } catch {
            /* noop */
          }
        }
        refreshMessengerLists();
      })();
    },
    [refreshMessengerLists],
  );

  const onInboundDmMessage = useCallback(
    (counterpartId: string, msg: MessengerViewMessage) => {
      setMessages((prev) => {
        const a = activeRef.current;
        if (a?.type !== 'dm' || a.userId !== counterpartId) return prev;
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      void (async () => {
        const a = activeRef.current;
        if (a?.type === 'dm' && a.userId === counterpartId) {
          try {
            await messengerApi.markDmRead(counterpartId);
          } catch {
            /* noop */
          }
        }
        refreshMessengerLists();
      })();
    },
    [refreshMessengerLists],
  );

  const showRemoteTypingHint = useCallback((hint: string) => {
    setRemoteTypingHint(hint);
    if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);
    typingClearTimerRef.current = setTimeout(() => {
      setRemoteTypingHint(null);
      typingClearTimerRef.current = null;
    }, MESSENGER_REMOTE_TYPING_HINT_MS);
  }, []);

  const onPresenceSnapshot = useCallback((employeeIds: readonly string[]) => {
    const next: Record<string, true> = {};
    for (const id of employeeIds) next[id] = true;
    setOnlineInMessengerById(next);
  }, []);

  const onPresenceDelta = useCallback((employeeId: string, state: 'online' | 'offline') => {
    setOnlineInMessengerById((prev) => {
      if (state === 'offline') {
        if (!(employeeId in prev)) return prev;
        const next = { ...prev };
        delete next[employeeId];
        return next;
      }
      if (prev[employeeId]) return prev;
      return { ...prev, [employeeId]: true };
    });
  }, []);

  const onDmPeerRead = useCallback((p: MessengerWsDmPeerReadPayload) => {
    if (activeRef.current?.type !== 'dm') return;
    if (p.counterpartId !== activeRef.current.userId) return;
    setDmPeerLastReadAt((prev) => {
      if (!p.lastReadAt) return prev;
      if (!prev) return p.lastReadAt;
      return new Date(p.lastReadAt) > new Date(prev) ? p.lastReadAt : prev;
    });
  }, []);

  const { emitChannelTyping, emitDmTyping } = useMessengerRealtime({
    canViewMessenger,
    meId: me?.id,
    active,
    onInboundChannelMessage,
    onInboundDmMessage,
    onRemoteTypingHint: showRemoteTypingHint,
    onPresenceSnapshot,
    onPresenceDelta,
    onReadListsInvalidate: refreshMessengerLists,
    onDmPeerRead,
    onChannelPeerRead,
  });

  const fireLocalTypingIntent = useCallback(() => {
    const a = activeRef.current;
    if (!a) return;
    const now = Date.now();
    if (now - lastLocalTypingEmitRef.current < MESSENGER_TYPING_EMIT_MIN_MS) return;
    lastLocalTypingEmitRef.current = now;
    if (a.type === 'channel') emitChannelTyping(a.id);
    else emitDmTyping(a.userId);
  }, [emitChannelTyping, emitDmTyping]);

  useEffect(() => {
    setRemoteTypingHint(null);
    if (typingClearTimerRef.current) {
      clearTimeout(typingClearTimerRef.current);
      typingClearTimerRef.current = null;
    }
  }, [active]);

  useEffect(() => {
    let cancelled = false;
    if (search.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await messengerApi.search(search.trim());
          if (!cancelled) setSearchResults(result.items);
        } catch {
          if (!cancelled) setSearchResults([]);
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search]);

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
    if (!canViewMessenger || !me || !active) {
      setDmPeerLastReadAt(null);
      setChannelReadReceipt({ seen: false, anchorId: null });
      return;
    }
    const activeSnapshot = active;
    const meId = me.id;
    let cancelled = false;
    (async () => {
      setMessagesLoading(true);
      setListError(null);
      try {
        if (activeSnapshot.type === 'channel') {
          setDmPeerLastReadAt(null);
          const res = await messengerApi.listChannelMessages(activeSnapshot.id);
          if (cancelled) return;
          setMessages(res.items.map(mapMessengerRowToView));
          setChannelReadReceipt({
            seen: res.lastOwnMessageSeenByOthers,
            anchorId: res.lastOwnMessageId,
          });
          await messengerApi.markChannelRead(activeSnapshot.id);
          if (!cancelled) refreshMessengerLists();
        } else {
          setChannelReadReceipt({ seen: false, anchorId: null });
          const res = await messengerApi.listDirectMessages(meId, activeSnapshot.userId);
          if (cancelled) return;
          setMessages(res.items.map(mapMessengerRowToView));
          setDmPeerLastReadAt(res.peerLastReadAt ?? null);
          await messengerApi.markDmRead(activeSnapshot.userId);
          if (!cancelled) refreshMessengerLists();
        }
      } catch (e) {
        if (!cancelled) {
          setListError(e instanceof Error ? e.message : 'Failed to load messages');
          setMessages([]);
          setDmPeerLastReadAt(null);
          setChannelReadReceipt({ seen: false, anchorId: null });
        }
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, me, canViewMessenger, refreshMessengerLists]);

  async function handleSend() {
    if (!canEditMessenger || !me || !active || !newMessage.trim() || sendBusy) return;
    const text = newMessage.trim();
    const fileAssetIds = attachmentDraft
      .split(/[,\s]+/)
      .map((id) => id.trim())
      .filter(Boolean);
    setSendBusy(true);
    setNewMessage('');
    setAttachmentDraft('');
    setRemoteTypingHint(null);
    if (typingClearTimerRef.current) {
      clearTimeout(typingClearTimerRef.current);
      typingClearTimerRef.current = null;
    }
    try {
      if (active.type === 'channel') {
        await messengerApi.sendChannelMessage(active.id, { content: text, fileAssetIds });
        const res = await messengerApi.listChannelMessages(active.id);
        setMessages(res.items.map(mapMessengerRowToView));
        setChannelReadReceipt({
          seen: res.lastOwnMessageSeenByOthers,
          anchorId: res.lastOwnMessageId,
        });
        await messengerApi.markChannelRead(active.id);
        refreshMessengerLists();
      } else {
        await messengerApi.sendDirectMessage({
          recipientId: active.userId,
          content: text,
          fileAssetIds,
        });
        const res = await messengerApi.listDirectMessages(me.id, active.userId);
        setMessages(res.items.map(mapMessengerRowToView));
        setDmPeerLastReadAt(res.peerLastReadAt ?? null);
        await messengerApi.markDmRead(active.userId);
        refreshMessengerLists();
      }
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'Send failed');
      setNewMessage(text);
      setAttachmentDraft(fileAssetIds.join(', '));
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
      online: Boolean(onlineInMessengerById[c.recipientId]),
      unreadCount: c.unreadCount,
    };
  });

  const channelSidebarItems = channels.map((c) => ({
    id: c.id,
    listLabel: c.name.startsWith('#') ? c.name : `#${c.name}`,
    unreadCount: c.unreadCount,
  }));

  const channelRow =
    active?.type === 'channel' ? channels.find((c) => c.id === active.id) : undefined;
  const dmPeer = active?.type === 'dm' ? dmPeers.find((p) => p.id === active.userId) : undefined;

  const dmReadReceiptTargetId =
    active?.type === 'dm' && me
      ? computeDmReadReceiptMessageId(messages, me.id, dmPeerLastReadAt)
      : null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-[#F5F5F0]">
      <div className="flex gap-2 border-b border-black/[0.06] bg-white px-4 py-2">
        <button
          type="button"
          onClick={() => setZone('internal')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            zone === 'internal'
              ? 'bg-[#E5A84B]/15 text-black'
              : 'text-black/45 hover:bg-black/[0.03]'
          }`}
        >
          Internal
        </button>
        <button
          type="button"
          onClick={() => setZone('external')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            zone === 'external'
              ? 'bg-[#E5A84B]/15 text-black'
              : 'text-black/45 hover:bg-black/[0.03]'
          }`}
        >
          External
        </button>
      </div>
      {listError ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-xs text-red-800">
          {listError}
        </div>
      ) : null}
      {zone === 'external' ? (
        <div className="flex flex-1 items-center justify-center bg-white p-8 text-center">
          <div className="max-w-md">
            <h2 className="text-lg font-semibold text-black">
              External Messenger is not connected yet
            </h2>
            <p className="mt-2 text-sm text-black/55">
              CRM Inbox, Project WhatsApp Groups, Support and Finance external conversations will
              use
              <code className="mx-1 rounded bg-black/[0.04] px-1">
                WhatsAppWebAdapter -&gt; WAHA
              </code>
              later. Internal messages cannot be sent to clients from here.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <MessengerSidebar
            channels={channelSidebarItems}
            dmPeers={dmPeers}
            active={active}
            onSelect={setActive}
            search={search}
            onSearchChange={setSearch}
            searchResults={searchResults}
            onSelectSearchResult={(result) => {
              if (result.scope === 'channel') setActive({ type: 'channel', id: result.channelId });
              if (result.scope === 'dm' && result.recipientId) {
                setActive({ type: 'dm', userId: result.recipientId });
              }
            }}
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
              attachmentDraft={attachmentDraft}
              onAttachmentDraftChange={setAttachmentDraft}
              onSend={() => {
                void handleSend();
              }}
              canSend={canEditMessenger}
              sendDisabled={!newMessage.trim() || sendBusy}
              remoteTypingHint={remoteTypingHint}
              onComposerTypingIntent={canEditMessenger ? fireLocalTypingIntent : undefined}
              dmReadReceiptMessageId={dmReadReceiptTargetId}
              channelReadReceipt={active.type === 'channel' ? channelReadReceipt : null}
            />
          )}
        </div>
      )}
    </div>
  );
}
