'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useHeaderModuleTitle } from '@/components/layout/header-context';
import { usePermission } from '@/lib/permissions/PermissionContext';
import { useInternalMessengerRealtime } from '@/features/messenger-internal/useInternalMessengerRealtime';
import { applyMessengerRealtimeMessage } from '@/features/messenger/query/messenger-cache';
import {
  applyMessengerAccessChanged,
  applyMessengerRealtimeRead,
  applyMessengerRealtimeSummary,
} from '@/features/messenger/query/messenger-realtime-cache';
import { recoverMessengerZone } from '@/features/messenger/query/messenger-delta-recovery';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import { resolveActiveConversation } from '@/features/messenger/query/resolve-active-conversation';
import { messengerClientApi } from '@/lib/api/messenger-core-client';
import { ClientCollectionsPanel } from './ClientCollectionsPanel';
import { ClientConversationList } from './ClientConversationList';
import { ClientConversationThread } from './ClientConversationThread';
import { ClientMessengerNav } from './ClientMessengerNav';
import { CLIENT_MESSENGER_SHELL_CLASS } from './client-messenger.constants';
import { clientSectionFromPathname } from './client-messenger-section';
import { sendClientThreadMessage } from './send-client-thread-message';
import { useClientOpenConversationQuery } from './use-client-open-conversation-query';
import { useClientMessengerQueries } from './use-client-messenger-queries';
import { useClientMessengerSession } from './use-client-messenger-session';
import {
  openClientConversation,
  patchClientAttention,
  toggleClientFavorite,
} from './client-messenger-cache-ops';

export function ClientMessengerApp() {
  const pathname = usePathname();
  const section = clientSectionFromPathname(pathname);
  return <ClientMessengerScreen section={section} />;
}

function ClientMessengerScreen({
  section,
}: {
  section: ReturnType<typeof clientSectionFromPathname>;
}) {
  const queryClient = useQueryClient();
  const { me, isLoading: permsLoading, meLoadError, can } = usePermission();
  const canView = can('VIEW', 'MESSENGER');
  useHeaderModuleTitle('Client Messenger', true);
  const session = useClientMessengerSession(section);
  const enabled = Boolean(canView && me);
  const data = useClientMessengerQueries({
    section,
    search: session.search,
    filter: session.filter,
    provider: session.provider,
    activeId: session.activeId,
    activeCollectionId: session.activeCollectionId,
    enabled,
  });
  const active = resolveActiveConversation(
    data.items,
    session.activeId,
    session.openedConversation,
  );
  const openConversation = useCallback(
    (id: string) =>
      openClientConversation(queryClient, id, session.setActiveId, session.setOpenedConversation),
    [queryClient, session.setActiveId, session.setOpenedConversation],
  );

  useClientOpenConversationQuery(openConversation);

  useInternalMessengerRealtime({
    canViewMessenger: canView,
    meId: me?.id,
    conversationId: session.activeId,
    onInboundMessage: (_conversationId, message) => {
      applyMessengerRealtimeMessage(queryClient, message);
    },
    onConversationSummary: (payload) => {
      applyMessengerRealtimeSummary(queryClient, 'CLIENT', payload);
    },
    onConversationRead: (payload) => {
      applyMessengerRealtimeRead(queryClient, 'CLIENT', payload);
    },
    onAccessChanged: (payload) => {
      applyMessengerAccessChanged(queryClient, 'CLIENT', payload.conversationId, payload.zone, {
        activeId: session.activeId,
        clearActive: () => session.setActiveId(null),
      });
    },
    onReconnect: () => {
      void recoverMessengerZone(queryClient, 'CLIENT', {
        activeId: session.activeId,
        clearActive: () => session.setActiveId(null),
      });
    },
    onReadListsInvalidate: () => {
      void queryClient.invalidateQueries({ queryKey: messengerQueryKeys.clientSummariesRoot });
    },
  });

  if (permsLoading) return <div className={CLIENT_MESSENGER_SHELL_CLASS} />;
  if (meLoadError || !canView) {
    return (
      <div
        className={`${CLIENT_MESSENGER_SHELL_CLASS} items-center justify-center p-6 text-sm text-black/50`}
      >
        You do not have access to Client Messenger.
      </div>
    );
  }

  return (
    <div className={CLIENT_MESSENGER_SHELL_CLASS}>
      <ClientMessengerNav section={section} />
      {session.bootError || data.listError ? (
        <p className="px-3 py-1 text-xs text-red-600">
          {session.bootError ?? 'Could not refresh Client Messenger.'}
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1">
        {section === 'collections' && !session.activeCollectionId ? (
          <ClientCollectionsPanel
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
          <ClientConversationList
            section={section}
            items={data.items}
            activeId={session.activeId}
            search={session.search}
            filter={session.filter}
            provider={session.provider}
            listPending={data.listPending}
            onSearchChange={session.setSearch}
            onFilterChange={session.setFilter}
            onProviderChange={session.setProvider}
            onSelect={(id) =>
              void openClientConversation(
                queryClient,
                id,
                session.setActiveId,
                session.setOpenedConversation,
              ).catch(() => session.setBootError('Could not open that Client conversation.'))
            }
            onToggleFavorite={(id) => void toggleClientFavorite(queryClient, id)}
          />
        )}
        {active ? (
          <ClientConversationThread
            conversation={active}
            messages={data.messages.data?.items ?? []}
            messagesLoading={data.messages.isPending && data.messages.data === undefined}
            newMessage={session.newMessage}
            onNewMessageChange={session.setNewMessage}
            unlockedConversationId={session.unlockedId}
            onUnlock={() => {
              if (active.canSend) session.setUnlockedId(active.id);
            }}
            onSend={(replyToMessageId) =>
              void sendClientThreadMessage({
                conversationId: session.activeId,
                canSend: Boolean(active.canSend),
                unlocked: session.unlockedId === session.activeId,
                unlockedConversationId: session.unlockedId,
                sendBusy: session.sendBusy,
                content: session.newMessage,
                replyToMessageId,
                setSendBusy: session.setSendBusy,
                setNewMessage: session.setNewMessage,
                queryClient,
              })
            }
            sendDisabled={session.sendBusy}
            onToggleFavorite={() => void toggleClientFavorite(queryClient, active.id)}
            collections={data.collections.data ?? []}
            onAddToCollection={(collectionId) =>
              void messengerClientApi.addCollectionItem(collectionId, active.id)
            }
            onInvite={async (employeeId) => {
              await messengerClientApi.inviteReadOnly(active.id, employeeId);
            }}
            onAttentionChange={(attention) => {
              patchClientAttention(queryClient, active.id, attention);
            }}
          />
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center bg-white text-sm text-black/40">
            Select a Client conversation
          </div>
        )}
      </div>
    </div>
  );

  async function createCollection(visibility: 'PERSONAL' | 'SHARED') {
    const name = session.collectionName.trim();
    if (!name) return;
    session.setCreatingCollection(true);
    try {
      await messengerClientApi.createCollection({ name, visibility });
      session.setCollectionName('');
      await queryClient.invalidateQueries({ queryKey: messengerQueryKeys.collections('CLIENT') });
    } finally {
      session.setCreatingCollection(false);
    }
  }
}
