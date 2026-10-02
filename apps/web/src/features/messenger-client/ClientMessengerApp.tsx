'use client';

import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useHeaderModuleTitle } from '@/components/layout/header-context';
import { usePermission } from '@/lib/permissions/PermissionContext';
import { useInternalMessengerRealtime } from '@/features/messenger-internal/useInternalMessengerRealtime';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import { resolveActiveConversation } from '@/features/messenger/query/resolve-active-conversation';
import { messengerClientApi } from '@/lib/api/messenger-core-client';
import { ClientCollectionsPanel } from './ClientCollectionsPanel';
import { ClientConversationList } from './ClientConversationList';
import { ClientConversationThread } from './ClientConversationThread';
import { ClientMessengerNav } from './ClientMessengerNav';
import {
  CLIENT_MESSENGER_SHELL_CLASS,
  type ClientMessengerSectionId,
} from './client-messenger.constants';
import { clientSectionFromPathname } from './client-messenger-section';
import { messengerComposerSenderName } from '@/features/messenger/query/messenger-local-send';
import { noteMessengerComposerDraft } from '@/features/messenger/query/messenger-send-claim';
import { sendClientThreadMessage } from './send-client-thread-message';
import { useClientOpenConversationQuery } from './use-client-open-conversation-query';
import { useClientMessengerQueries } from './use-client-messenger-queries';
import { useClientMessengerSession } from './use-client-messenger-session';
import { VisibleThreadRead } from '@/features/messenger/query/use-visible-conversation-read';
import {
  openClientConversation,
  patchClientAttention,
  toggleClientFavorite,
} from './client-messenger-cache-ops';
import {
  portfolioScopeEmptyCopy,
  usePortfolioClientScope,
  usePortfolioTargetFromLocation,
  type PortfolioClientTarget,
} from './use-portfolio-client-scope';

const CLIENT_SHEET_SHELL_CLASS =
  'flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card text-card-foreground';

export function ClientMessengerApp({
  embedded = false,
  portfolio = null,
  section: sectionOverride,
  onSectionChange,
  requestedConversationId = null,
  onRequestedConversationHandled,
}: {
  embedded?: boolean;
  portfolio?: PortfolioClientTarget | null;
  section?: ClientMessengerSectionId;
  onSectionChange?: (section: ClientMessengerSectionId) => void;
  requestedConversationId?: string | null;
  onRequestedConversationHandled?: () => void;
}) {
  const pathname = usePathname();
  const section = sectionOverride ?? clientSectionFromPathname(pathname);
  const fromLocation = usePortfolioTargetFromLocation();
  return (
    <ClientMessengerScreen
      section={section}
      embedded={embedded}
      portfolio={portfolio ?? fromLocation}
      onSectionChange={onSectionChange}
      requestedConversationId={requestedConversationId}
      onRequestedConversationHandled={onRequestedConversationHandled}
    />
  );
}

function ClientMessengerScreen({
  section,
  embedded,
  portfolio,
  onSectionChange,
  requestedConversationId,
  onRequestedConversationHandled,
}: {
  section: ClientMessengerSectionId;
  embedded: boolean;
  portfolio: PortfolioClientTarget | null;
  onSectionChange?: (section: ClientMessengerSectionId) => void;
  requestedConversationId?: string | null;
  onRequestedConversationHandled?: () => void;
}) {
  const queryClient = useQueryClient();
  const { me, isLoading: permsLoading, meLoadError, can } = usePermission();
  const canView = can('VIEW', 'MESSENGER');
  useHeaderModuleTitle('Client Messenger', !embedded);
  const portfolioScope = usePortfolioClientScope(portfolio);
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
  const listItems = portfolio ? portfolioScope.rows : data.items;
  const active = resolveActiveConversation(listItems, session.activeId, session.openedConversation);
  const openConversation = useCallback(
    (id: string) =>
      openClientConversation(queryClient, id, session.setActiveId, session.setOpenedConversation),
    [queryClient, session.setActiveId, session.setOpenedConversation],
  );

  useClientOpenConversationQuery(openConversation);
  const portfolioContactId = portfolio?.contactId ?? null;
  const portfolioCompanyId = portfolio?.companyId ?? null;
  useEffect(() => {
    if ((!portfolioContactId && !portfolioCompanyId) || !portfolioScope.uniqueConversationId)
      return;
    void openConversation(portfolioScope.uniqueConversationId);
  }, [
    openConversation,
    portfolioCompanyId,
    portfolioContactId,
    portfolioScope.uniqueConversationId,
  ]);
  useEffect(() => {
    if (!requestedConversationId) return;
    void openConversation(requestedConversationId).finally(() =>
      onRequestedConversationHandled?.(),
    );
  }, [openConversation, onRequestedConversationHandled, requestedConversationId]);

  useInternalMessengerRealtime({
    canViewMessenger: canView,
    meId: me?.id,
    zone: 'CLIENT',
    conversationId: session.activeId,
    clearActive: () => session.setActiveId(null),
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

  const shellClass = embedded ? CLIENT_SHEET_SHELL_CLASS : CLIENT_MESSENGER_SHELL_CLASS;
  return (
    <div className={shellClass}>
      <VisibleThreadRead
        zone="CLIENT"
        conversationId={session.activeId}
        threadMounted={Boolean(active)}
        items={data.messages.data?.items}
      />
      <ClientMessengerNav section={section} onSectionChange={onSectionChange} />
      {session.bootError || data.listError || portfolioScope.error ? (
        <p className="px-3 py-1 text-xs text-red-600">
          {session.bootError ??
            (portfolioScope.error
              ? 'Could not open Client Messenger for this portfolio.'
              : 'Could not refresh Client Messenger.')}
        </p>
      ) : null}
      {portfolio ? (
        <p className="px-3 pt-2 text-xs text-teal-900">Client Messenger · {portfolioScope.label}</p>
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
            items={listItems}
            emptyCopy={
              portfolio && portfolioScope.empty
                ? portfolioScopeEmptyCopy(portfolioScope.label)
                : undefined
            }
            activeId={session.activeId}
            search={session.search}
            filter={session.filter}
            provider={session.provider}
            listPending={portfolio ? portfolioScope.loading : data.listPending}
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
            onNewMessageChange={(value) => {
              noteMessengerComposerDraft(session.activeId, value);
              session.setNewMessage(value);
            }}
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
                content: session.newMessage,
                replyToMessageId,
                setNewMessage: (value) => {
                  noteMessengerComposerDraft(session.activeId, value);
                  session.setNewMessage(value);
                },
                queryClient,
                senderId: me?.id ?? null,
                senderName: messengerComposerSenderName(me),
              })
            }
            sendDisabled={false}
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
          <div className="text-muted-foreground bg-card flex min-h-0 flex-1 items-center justify-center text-sm">
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
