'use client';

import { useCallback, useRef, useState } from 'react';
import {
  MESSENGER_TYPING_EMIT_MIN_MS,
  type MessengerWsConversationPeerReadPayload,
} from '@nbos/shared';
import { usePermission } from '@/lib/permissions/PermissionContext';
import { useHeaderModuleTitle } from '@/components/layout/header-context';
import {
  messengerApi,
  type MessengerConversationDetail,
  type MessengerL1EntityRow,
} from '@/lib/api/messenger';
import { MessengerL1Panel } from './MessengerL1Panel';
import { MessengerL2Panel } from './MessengerL2Panel';
import { MessengerThread } from './MessengerThread';
import type { MessengerActiveView } from './messenger-active-view';
import {
  initialsFromDisplayName,
  type MessengerViewMessage,
} from './messenger-message-mapper';
import { mapUnifiedMessageToView } from './messenger-unified-message.mapper';
import { dmReadReceiptMessageId as computeDmReadReceiptMessageId } from './messenger-dm-read-receipt.util';
import { MESSENGER_REMOTE_TYPING_HINT_MS } from './messenger-typing-ui.constants';
import {
  type MessengerInternalTabId,
} from './messenger-internal.constants';
import { useMessengerRealtime } from './useMessengerRealtime';
import { useMessengerNavigation } from './useMessengerNavigation';
import { MessengerInternalChrome } from './MessengerInternalChrome';

function shellClass(embedded: boolean): string {
  return embedded
    ? 'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-[#F5F5F0]'
    : 'flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-[#F5F5F0]';
}

function centerClass(embedded: boolean): string {
  return embedded
    ? 'flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-black/[0.06] bg-[#F5F5F0]'
    : 'flex h-full min-h-0 flex-1 items-center justify-center rounded-2xl border border-black/[0.06] bg-[#F5F5F0]';
}

function entityKey(entity: MessengerL1EntityRow): string {
  return `${entity.entityType}:${entity.entityId}`;
}

function parseAttachmentIds(draft: string): string[] | undefined {
  const ids = draft
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.length > 0 ? ids : undefined;
}

export function MessengerClient({ embedded = false }: { embedded?: boolean }) {
  const { me, isLoading: permsLoading, can } = usePermission();
  const canViewMessenger = can('VIEW', 'MESSENGER');
  const canEditMessenger = can('EDIT', 'MESSENGER');
  useHeaderModuleTitle('Messenger', !embedded);

  const [zone, setZone] = useState<'internal' | 'external'>('internal');
  const [tab, setTab] = useState<MessengerInternalTabId>('all');
  const nav = useMessengerNavigation(tab, canViewMessenger);

  const [active, setActive] = useState<MessengerActiveView | null>(null);
  const [conversationDetail, setConversationDetail] =
    useState<MessengerConversationDetail | null>(null);
  const [messages, setMessages] = useState<MessengerViewMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const [sendBusy, setSendBusy] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [attachmentDraft, setAttachmentDraft] = useState('');
  const [remoteTypingHint, setRemoteTypingHint] = useState<string | null>(null);
  const [peerLastReadAt, setPeerLastReadAt] = useState<string | null>(null);
  const [channelReadReceipt, setChannelReadReceipt] = useState<{
    seen: boolean;
    anchorId: string | null;
  }>({ seen: false, anchorId: null });

  const typingClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLocalTypingEmitRef = useRef(0);
  const activeRef = useRef(active);
  activeRef.current = active;

  const openConversation = useCallback(
    async (conversationId: string, peerEmployeeId?: string | null) => {
      setActive({ type: 'conversation', id: conversationId, peerEmployeeId });
      setMessagesLoading(true);
      setNewMessage('');
      setAttachmentDraft('');
      try {
        const [detail, page] = await Promise.all([
          messengerApi.getConversation(conversationId),
          messengerApi.listConversationMessages(conversationId),
        ]);
        setConversationDetail(detail);
        setMessages(page.items.map(mapUnifiedMessageToView));
        setHasMoreOlder(Boolean(page.meta.hasMoreOlder));
        setPeerLastReadAt(page.peerLastReadAt);
        setChannelReadReceipt({
          seen: page.lastOwnMessageSeenByOthers,
          anchorId: page.lastOwnMessageId,
        });
        await messengerApi.markConversationRead(conversationId);
        void nav.refreshL1();
        void nav.refreshL2();
      } catch {
        setBootError('Failed to open conversation');
      } finally {
        setMessagesLoading(false);
      }
    },
    [nav],
  );

  const onInboundConversationMessage = useCallback(
    (conversationId: string, msg: MessengerViewMessage) => {
      if (activeRef.current?.id === conversationId) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        void messengerApi.markConversationRead(conversationId);
      }
      void nav.refreshL1();
      void nav.refreshL2();
    },
    [nav],
  );

  const realtime = useMessengerRealtime({
    canViewMessenger,
    meId: me?.id,
    active,
    onInboundConversationMessage,
    onRemoteTypingHint: (hint) => {
      setRemoteTypingHint(hint);
      if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);
      typingClearTimerRef.current = setTimeout(() => {
        setRemoteTypingHint(null);
      }, MESSENGER_REMOTE_TYPING_HINT_MS);
    },
    onReadListsInvalidate: () => {
      void nav.refreshL1();
      void nav.refreshL2();
    },
    onConversationPeerRead: (payload: MessengerWsConversationPeerReadPayload) => {
      if (activeRef.current?.id !== payload.conversationId) return;
      setPeerLastReadAt(payload.lastReadAt);
      void messengerApi.listConversationMessages(payload.conversationId).then((page) => {
        setChannelReadReceipt({
          seen: page.lastOwnMessageSeenByOthers,
          anchorId: page.lastOwnMessageId,
        });
      });
    },
  });

  const handleSend = useCallback(async () => {
    if (!active || !conversationDetail?.canSend || !canEditMessenger) return;
    const content = newMessage.trim();
    if (!content || sendBusy) return;
    setSendBusy(true);
    try {
      const created = await messengerApi.sendConversationMessage(active.id, {
        content,
        fileAssetIds: parseAttachmentIds(attachmentDraft),
      });
      setMessages((prev) =>
        prev.some((m) => m.id === created.id)
          ? prev
          : [...prev, mapUnifiedMessageToView(created)],
      );
      setNewMessage('');
      setAttachmentDraft('');
      void nav.refreshL1();
      void nav.refreshL2();
    } catch {
      setBootError('Failed to send message');
    } finally {
      setSendBusy(false);
    }
  }, [active, attachmentDraft, canEditMessenger, conversationDetail?.canSend, nav, newMessage, sendBusy]);

  const handleLoadOlder = useCallback(async () => {
    if (!active || olderLoading || !hasMoreOlder || messages.length === 0) return;
    const oldest = messages[0];
    if (!oldest) return;
    setOlderLoading(true);
    try {
      const page = await messengerApi.listConversationMessages(active.id, {
        before: oldest.timestamp,
      });
      const older = page.items.map(mapUnifiedMessageToView);
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        return [...older.filter((m) => !ids.has(m.id)), ...prev];
      });
      setHasMoreOlder(Boolean(page.meta.hasMoreOlder));
    } finally {
      setOlderLoading(false);
    }
  }, [active, hasMoreOlder, messages, olderLoading]);

  const onComposerTypingIntent = useCallback(() => {
    if (!active) return;
    const now = Date.now();
    if (now - lastLocalTypingEmitRef.current < MESSENGER_TYPING_EMIT_MIN_MS) return;
    lastLocalTypingEmitRef.current = now;
    realtime.emitConversationTyping(active.id);
  }, [active, realtime]);

  if (permsLoading) {
    return (
      <div className={centerClass(embedded)}>
        <p className="text-sm text-black/40">Loading permissions…</p>
      </div>
    );
  }
  if (!canViewMessenger) {
    return (
      <div className={centerClass(embedded)}>
        <p className="text-sm text-black/50">You do not have access to Messenger.</p>
      </div>
    );
  }

  const dmReceiptId =
    conversationDetail?.type === 'DIRECT' && me?.id
      ? computeDmReadReceiptMessageId(messages, me.id, peerLastReadAt)
      : null;

  return (
    <div className={shellClass(embedded)}>
      <MessengerInternalChrome
        zone={zone}
        onZoneChange={setZone}
        tab={tab}
        onTabChange={(next) => {
          setTab(next);
          setActive(null);
          setConversationDetail(null);
          setMessages([]);
        }}
        messageSearch={nav.messageSearch}
        onMessageSearchChange={nav.setMessageSearch}
      />

      {(bootError || nav.listError) && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          {bootError ?? nav.listError}
        </div>
      )}

      {zone === 'external' ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md text-center">
            <p className="text-sm font-semibold text-black">External Messenger</p>
            <p className="mt-2 text-sm text-black/50">
              Client-facing channels stay separate from Internal Messenger and will connect later.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <MessengerL1Panel
            entities={nav.entities}
            selectedEntityKey={nav.selectedEntity ? entityKey(nav.selectedEntity) : null}
            onSelect={(entity) => {
              void (async () => {
                const id = await nav.selectEntity(entity);
                if (id) await openConversation(id);
                else {
                  setActive(null);
                  setConversationDetail(null);
                  setMessages([]);
                }
              })();
            }}
            search={nav.l1Search}
            onSearchChange={nav.setL1Search}
          />
          <MessengerL2Panel
            conversations={nav.conversations}
            activeConversationId={active?.id ?? null}
            onSelect={(c) => {
              void openConversation(c.id, c.peerEmployeeId);
            }}
            searchResults={nav.searchResults}
            onSelectSearchResult={(result) => {
              void openConversation(result.conversationId);
            }}
            emptyHint={
              nav.selectedEntity
                ? 'No conversations yet — open an entity to create its chat.'
                : 'Select an entity on the left.'
            }
          />
          {conversationDetail && active ? (
            <MessengerThread
              conversation={conversationDetail}
              messages={messages}
              messagesLoading={messagesLoading}
              hasMoreOlder={hasMoreOlder}
              olderLoading={olderLoading}
              onLoadOlder={handleLoadOlder}
              newMessage={newMessage}
              onNewMessageChange={setNewMessage}
              attachmentDraft={attachmentDraft}
              onAttachmentDraftChange={setAttachmentDraft}
              onSend={() => {
                void handleSend();
              }}
              canSend={canEditMessenger && conversationDetail.canSend}
              sendDisabled={sendBusy || !newMessage.trim()}
              remoteTypingHint={remoteTypingHint}
              onComposerTypingIntent={onComposerTypingIntent}
              dmReadReceiptMessageId={dmReceiptId}
              channelReadReceipt={channelReadReceipt}
              headerInitials={initialsFromDisplayName(conversationDetail.title)}
            />
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center bg-white">
              <p className="text-sm text-black/40">Select a conversation to start chatting.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
