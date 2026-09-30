'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useHeaderModuleTitle } from '@/components/layout/header-context';
import { usePermission } from '@/lib/permissions/PermissionContext';
import {
  applyMessengerRealtimeMessage,
  patchConversationLastMessageSeen,
  syncConversationListReceipt,
} from '@/features/messenger/query/messenger-cache';
import {
  applyMessengerAccessChanged,
  applyMessengerRealtimeRead,
  applyMessengerRealtimeSummary,
} from '@/features/messenger/query/messenger-realtime-cache';
import { recoverMessengerZone } from '@/features/messenger/query/messenger-delta-recovery';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import { resolveActiveConversation } from '@/features/messenger/query/resolve-active-conversation';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { INTERNAL_MESSENGER_SHELL_CLASS } from './internal-messenger.constants';
import { InternalMessengerSheetFrame } from './InternalMessengerSheetFrame';
import { sectionFromPathname } from './internal-messenger-section';
import type { InternalMessengerSectionId } from './internal-messenger.constants';
import { InternalCollectionsPanel } from './InternalCollectionsPanel';
import { InternalConversationList } from './InternalConversationList';
import { InternalConversationThread } from './InternalConversationThread';
import { InternalGroupsEmptyPane } from './InternalGroupsEmptyPane';
import { InternalMessengerNav } from './InternalMessengerNav';
import { sendInternalThreadMessage } from './send-internal-thread-message';
import { useInternalMessengerQueries } from './use-internal-messenger-queries';
import { useInternalMessengerRealtime } from './useInternalMessengerRealtime';
import { useInternalMessengerSession } from './use-internal-messenger-session';
import { createInternalGroupConversation } from './create-internal-group';
import { openInternalConversation, toggleInternalFavorite } from './internal-messenger-cache-ops';
import { useMessengerConversationLaunch } from './use-messenger-conversation-launch';
import { MessengerPresenceProvider } from './PresenceAvatar';

export function InternalMessengerApp({
  embedded = false,
  section: sectionOverride,
  onSectionChange,
  launchConversationId = null,
}: {
  embedded?: boolean;
  section?: InternalMessengerSectionId;
  onSectionChange?: (section: InternalMessengerSectionId) => void;
  launchConversationId?: string | null;
}) {
  const pathname = usePathname();
  const section = sectionOverride ?? sectionFromPathname(pathname);
  return (
    <InternalMessengerScreen
      section={section}
      embedded={embedded}
      onSectionChange={onSectionChange}
      launchConversationId={launchConversationId}
    />
  );
}

function InternalMessengerScreen({
  section,
  embedded,
  onSectionChange,
  launchConversationId,
}: {
  section: ReturnType<typeof sectionFromPathname>;
  embedded: boolean;
  onSectionChange?: (section: InternalMessengerSectionId) => void;
  launchConversationId: string | null;
}) {
  const queryClient = useQueryClient();
  const { me, isLoading: permsLoading, meLoadError, can } = usePermission();
  const canView = can('VIEW', 'MESSENGER');
  useHeaderModuleTitle('Internal Messenger', !embedded);
  const session = useInternalMessengerSession(section);
  const enabled = Boolean(canView && me);
  const data = useInternalMessengerQueries({
    section,
    search: session.search,
    filter: session.filter,
    activeId: session.activeId,
    activeCollectionId: session.activeCollectionId,
    enabled,
  });
  const active = resolveActiveConversation(
    data.items,
    session.activeId,
    session.openedConversation,
  );

  useMessengerConversationLaunch({
    queryClient,
    enabled,
    launchConversationId,
    setActiveId: session.setActiveId,
    setOpenedConversation: session.setOpenedConversation,
    setBootError: session.setBootError,
  });

  const { onlineIds, typingPeer, emitConversationTyping } = useInternalMessengerRealtime({
    canViewMessenger: canView,
    meId: me?.id,
    conversationId: session.activeId,
    onInboundMessage: (_conversationId, message) => {
      applyMessengerRealtimeMessage(queryClient, message);
    },
    onConversationSummary: (payload) => {
      applyMessengerRealtimeSummary(queryClient, 'INTERNAL', payload);
    },
    onConversationRead: (payload) => {
      applyMessengerRealtimeRead(queryClient, 'INTERNAL', payload);
    },
    onAccessChanged: (payload) => {
      applyMessengerAccessChanged(queryClient, 'INTERNAL', payload.conversationId, payload.zone, {
        activeId: session.activeId,
        clearActive: () => session.setActiveId(null),
      });
    },
    onReconnect: () => {
      void recoverMessengerZone(queryClient, 'INTERNAL', {
        activeId: session.activeId,
        clearActive: () => session.setActiveId(null),
      });
    },
    onReadListsInvalidate: () => {
      void queryClient.invalidateQueries({ queryKey: messengerQueryKeys.internalSummariesRoot });
    },
    onPeerRead: (payload) => {
      patchConversationLastMessageSeen(
        queryClient,
        'INTERNAL',
        payload.conversationId,
        payload.lastReadAt,
      );
      void queryClient.invalidateQueries({
        queryKey: messengerQueryKeys.messages(payload.conversationId),
      });
    },
  });

  useEffect(() => {
    if (!session.activeId || !me?.id) return;
    const messages = data.messages.data?.items;
    if (!messages?.length) return;
    syncConversationListReceipt(queryClient, 'INTERNAL', {
      conversationId: session.activeId,
      viewerId: me.id,
      messages,
      peerLastReadAt: data.messages.data?.meta.peerLastReadAt ?? null,
    });
  }, [
    queryClient,
    session.activeId,
    me?.id,
    data.messages.data?.items,
    data.messages.data?.meta.peerLastReadAt,
  ]);

  if (permsLoading) {
    return (
      <InternalMessengerSheetFrame embedded={embedded}>
        <div className={INTERNAL_MESSENGER_SHELL_CLASS} />
      </InternalMessengerSheetFrame>
    );
  }
  if (meLoadError || !canView) {
    return (
      <InternalMessengerSheetFrame embedded={embedded}>
        <div
          className={`${INTERNAL_MESSENGER_SHELL_CLASS} items-center justify-center p-6 text-sm text-[#64748b]`}
        >
          You do not have access to Internal Messenger.
        </div>
      </InternalMessengerSheetFrame>
    );
  }

  return (
    <MessengerPresenceProvider onlineIds={onlineIds}>
      <InternalMessengerSheetFrame embedded={embedded}>
        <InternalMessengerNav section={section} onSectionChange={onSectionChange} />
        {session.bootError || data.listError ? (
          <p className="px-3 py-1 text-xs text-red-600">
            {session.bootError ?? 'Could not refresh Internal Messenger.'}
          </p>
        ) : null}
        <div className="flex min-h-0 flex-1">
          {section === 'collections' && !session.activeCollectionId ? (
            <InternalCollectionsPanel
              collections={data.collections.data ?? []}
              activeId={session.activeCollectionId}
              newName={session.collectionName}
              creating={session.creatingCollection}
              onNewNameChange={session.setCollectionName}
              onCreatePersonal={() => void createCollection('PERSONAL')}
              onCreateShared={() => void createCollection('SHARED')}
              onSelect={(id) => session.setActiveCollectionId(id)}
            />
          ) : (
            <div className="flex w-80 max-w-[46%] shrink-0 flex-col border-r border-[#f1f5f9] bg-[#fafbfc]">
              <InternalConversationList
                section={section}
                items={data.items}
                activeId={session.activeId}
                search={session.search}
                filter={session.filter}
                listPending={data.listPending}
                onCreateGroup={section === 'groups' ? createGroup : undefined}
                onSearchChange={session.setSearch}
                onFilterChange={session.setFilter}
                onSelect={(id) =>
                  void openInternalConversation(
                    queryClient,
                    id,
                    session.setActiveId,
                    session.setOpenedConversation,
                  ).catch(() => session.setBootError('Could not open that Internal conversation.'))
                }
                onToggleFavorite={(id) => void toggleInternalFavorite(queryClient, id)}
              />
            </div>
          )}
          {active ? (
            <InternalConversationThread
              conversation={active}
              messages={data.messages.data?.items ?? []}
              peerLastReadAt={data.messages.data?.meta.peerLastReadAt ?? null}
              messagesLoading={data.messages.isPending && data.messages.data === undefined}
              newMessage={session.newMessage}
              onNewMessageChange={session.setNewMessage}
              pendingForward={session.pendingForward}
              onClearPendingForward={() => session.setPendingForward(null)}
              onBeginForward={(target, draft) => session.beginForwardTo(target, draft)}
              onSend={(extras) =>
                void sendInternalThreadMessage({
                  conversationId: session.activeId,
                  canWrite: Boolean(active.canWrite),
                  sendBusy: session.sendBusy,
                  content: session.newMessage,
                  extras,
                  setSendBusy: session.setSendBusy,
                  setNewMessage: session.setNewMessage,
                  queryClient,
                })
              }
              canSend={Boolean(active.canWrite)}
              sendDisabled={session.sendBusy}
              onToggleFavorite={() => void toggleInternalFavorite(queryClient, active.id)}
              collections={data.collections.data ?? []}
              onAddToCollection={(collectionId) =>
                void messengerCoreApi.addCollectionItem(collectionId, active.id)
              }
              remoteTypingHint={null}
              typingPeer={typingPeer}
              onTypingIntent={emitConversationTyping}
              onOpenInternalSource={(id, seed) => {
                if (seed) {
                  session.openTargetConversation(seed);
                  return;
                }
                void openInternalConversation(
                  queryClient,
                  id,
                  session.setActiveId,
                  session.setOpenedConversation,
                );
              }}
            />
          ) : section === 'groups' ? (
            <InternalGroupsEmptyPane onCreateGroup={createGroup} />
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center bg-[#eef2ff] text-sm text-[#64748b]">
              Select an Internal conversation
            </div>
          )}
        </div>
      </InternalMessengerSheetFrame>
    </MessengerPresenceProvider>
  );

  async function createGroup(title: string) {
    await createInternalGroupConversation(
      queryClient,
      title,
      session.setActiveId,
      session.setOpenedConversation,
    );
  }

  async function createCollection(visibility: 'PERSONAL' | 'SHARED') {
    const name = session.collectionName.trim();
    if (!name) return;
    session.setCreatingCollection(true);
    try {
      await messengerCoreApi.createCollection({ name, visibility });
      session.setCollectionName('');
      await queryClient.invalidateQueries({ queryKey: messengerQueryKeys.collections('INTERNAL') });
    } finally {
      session.setCreatingCollection(false);
    }
  }
}
