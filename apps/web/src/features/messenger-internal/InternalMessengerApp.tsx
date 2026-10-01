'use client';

import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useHeaderModuleTitle } from '@/components/layout/header-context';
import { usePermission } from '@/lib/permissions/PermissionContext';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import { resolveActiveConversation } from '@/features/messenger/query/resolve-active-conversation';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { INTERNAL_MESSENGER_SHELL_CLASS } from './internal-messenger.constants';
import { sectionFromPathname } from './internal-messenger-section';
import { InternalCollectionsPanel } from './InternalCollectionsPanel';
import { InternalConversationList } from './InternalConversationList';
import { InternalConversationThread } from './InternalConversationThread';
import { InternalMessengerNav } from './InternalMessengerNav';
import { InternalStartBar } from './InternalStartBar';
import { messengerComposerSenderName } from '@/features/messenger/query/messenger-local-send';
import { noteMessengerComposerDraft } from '@/features/messenger/query/messenger-send-claim';
import { sendInternalThreadMessage } from './send-internal-thread-message';
import { useInternalMessengerQueries } from './use-internal-messenger-queries';
import { useInternalMessengerRealtime } from './useInternalMessengerRealtime';
import { useInternalMessengerSession } from './use-internal-messenger-session';
import { VisibleThreadRead } from '@/features/messenger/query/use-visible-conversation-read';
import { openInternalConversation, toggleInternalFavorite } from './internal-messenger-cache-ops';

export function InternalMessengerApp({ embedded = false }: { embedded?: boolean }) {
  const pathname = usePathname();
  const section = sectionFromPathname(pathname);
  return <InternalMessengerScreen section={section} embedded={embedded} />;
}

function InternalMessengerScreen({
  section,
  embedded,
}: {
  section: ReturnType<typeof sectionFromPathname>;
  embedded: boolean;
}) {
  const queryClient = useQueryClient();
  const { me, isLoading: permsLoading, meLoadError, can } = usePermission();
  const canView = can('VIEW', 'MESSENGER');
  const canEdit = can('EDIT', 'MESSENGER');
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

  useInternalMessengerRealtime({
    canViewMessenger: canView,
    meId: me?.id,
    zone: 'INTERNAL',
    conversationId: session.activeId,
    clearActive: () => session.setActiveId(null),
  });

  if (permsLoading) return <div className={INTERNAL_MESSENGER_SHELL_CLASS} />;
  if (meLoadError || !canView) {
    return (
      <div
        className={`${INTERNAL_MESSENGER_SHELL_CLASS} items-center justify-center p-6 text-sm text-black/50`}
      >
        You do not have access to Internal Messenger.
      </div>
    );
  }

  return (
    <div className={INTERNAL_MESSENGER_SHELL_CLASS}>
      <VisibleThreadRead
        zone="INTERNAL"
        conversationId={session.activeId}
        threadMounted={Boolean(active)}
        items={data.messages.data?.items}
      />
      <InternalMessengerNav section={section} />
      <InternalStartBar
        section={section}
        canEdit={canEdit}
        onCreateGroup={async (title) => {
          const created = await messengerCoreApi.createConversation({
            type: 'INTERNAL_GROUP',
            title,
          });
          await openInternalConversation(
            queryClient,
            created.id,
            session.setActiveId,
            session.setOpenedConversation,
          );
        }}
        onStartDirect={async (peerEmployeeId) => {
          const created = await messengerCoreApi.createConversation({
            type: 'DIRECT',
            peerEmployeeId,
          });
          await openInternalConversation(
            queryClient,
            created.id,
            session.setActiveId,
            session.setOpenedConversation,
          );
        }}
      />
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
          <InternalConversationList
            section={section}
            items={data.items}
            activeId={session.activeId}
            search={session.search}
            filter={session.filter}
            listPending={data.listPending}
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
        )}
        {active ? (
          <InternalConversationThread
            conversation={active}
            messages={data.messages.data?.items ?? []}
            messagesLoading={data.messages.isPending && data.messages.data === undefined}
            newMessage={session.newMessage}
            onNewMessageChange={(value) => {
              noteMessengerComposerDraft(session.activeId, value);
              session.setNewMessage(value);
            }}
            onSend={(extras) =>
              void sendInternalThreadMessage({
                conversationId: session.activeId,
                canWrite: Boolean(active.canWrite),
                content: session.newMessage,
                extras,
                setNewMessage: (value) => {
                  noteMessengerComposerDraft(session.activeId, value);
                  session.setNewMessage(value);
                },
                queryClient,
                senderId: me?.id ?? null,
                senderName: messengerComposerSenderName(me),
              })
            }
            canSend={Boolean(active.canWrite)}
            sendDisabled={false}
            onToggleFavorite={() => void toggleInternalFavorite(queryClient, active.id)}
            collections={data.collections.data ?? []}
            onAddToCollection={(collectionId) =>
              void messengerCoreApi.addCollectionItem(collectionId, active.id)
            }
            remoteTypingHint={null}
            onOpenInternalSource={(id) =>
              void openInternalConversation(
                queryClient,
                id,
                session.setActiveId,
                session.setOpenedConversation,
              )
            }
          />
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center bg-white text-sm text-black/40">
            Select an Internal conversation
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
      await messengerCoreApi.createCollection({ name, visibility });
      session.setCollectionName('');
      await queryClient.invalidateQueries({ queryKey: messengerQueryKeys.collections('INTERNAL') });
    } finally {
      session.setCreatingCollection(false);
    }
  }
}
