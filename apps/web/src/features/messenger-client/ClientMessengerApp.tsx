'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useHeaderModuleTitle } from '@/components/layout/header-context';
import { usePermission } from '@/lib/permissions/PermissionContext';
import { useInternalMessengerRealtime } from '@/features/messenger-internal/useInternalMessengerRealtime';
import { mergeCoreRealtimeMessage } from '@/features/messenger/merge-core-realtime-message';
import type { MessengerCoreCollectionRow, MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import {
  messengerClientApi,
  type MessengerClientConversationRow,
  type MessengerClientListFilter,
  type MessengerClientProvider,
} from '@/lib/api/messenger-core-client';
import { ClientCollectionsPanel } from './ClientCollectionsPanel';
import { ClientConversationList } from './ClientConversationList';
import { ClientConversationThread } from './ClientConversationThread';
import { ClientMessengerNav } from './ClientMessengerNav';
import { CLIENT_MESSENGER_SHELL_CLASS } from './client-messenger.constants';
import { clientSectionFromPathname } from './client-messenger-section';
import { relockComposerOnConversationChange } from './client-composer-unlock';
import { sendClientThreadMessage } from './send-client-thread-message';
import { useClientOpenConversationQuery } from './use-client-open-conversation-query';

export function ClientMessengerApp() {
  const pathname = usePathname();
  const section = clientSectionFromPathname(pathname);
  const { me, isLoading: permsLoading, meLoadError, can } = usePermission();
  const canView = can('VIEW', 'MESSENGER');
  useHeaderModuleTitle('Client Messenger', true);

  const [items, setItems] = useState<MessengerClientConversationRow[]>([]);
  const [collections, setCollections] = useState<MessengerCoreCollectionRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessengerCoreMessageRow[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | MessengerClientListFilter>('all');
  const [provider, setProvider] = useState<'' | MessengerClientProvider>('');
  const [newMessage, setNewMessage] = useState('');
  const [unlockedId, setUnlockedId] = useState<string | null>(null);
  const [sendBusy, setSendBusy] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  const refreshLists = useCallback(async () => {
    const collectionRows = await messengerClientApi.listCollections();
    setCollections(collectionRows);
    if (section === 'collections') return;
    const result = await messengerClientApi.listConversations({
      section,
      q: search.trim() || undefined,
      filter: filter === 'all' ? undefined : filter,
      provider: provider || undefined,
    });
    setItems(result.items);
  }, [section, search, filter, provider]);

  useEffect(() => {
    setActiveId(null);
    setActiveCollectionId(null);
    setMessages([]);
    setItems([]);
    setSearch('');
    setFilter('all');
    setProvider('');
    setNewMessage('');
    setUnlockedId(null);
  }, [section]);

  useEffect(() => {
    setUnlockedId((prev) => relockComposerOnConversationChange(prev, activeId));
    setNewMessage('');
  }, [activeId]);

  useEffect(() => {
    if (!canView || !me) return;
    void refreshLists().catch(() => setBootError('Could not load Client Messenger.'));
  }, [canView, me, refreshLists]);

  const openConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setMessagesLoading(true);
    try {
      const [conversation, page] = await Promise.all([
        messengerClientApi.getConversation(id),
        messengerClientApi.listMessages(id),
      ]);
      setItems((prev) => upsertClientConversation(prev, id, conversation));
      setMessages(page.items);
      await messengerClientApi.markRead(id);
    } catch {
      setBootError('Could not open that Client conversation.');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useClientOpenConversationQuery(openConversation);

  useInternalMessengerRealtime({
    canViewMessenger: canView,
    meId: me?.id,
    conversationId: activeId,
    onInboundMessage: (conversationId, message) => {
      if (conversationId === activeId) {
        setMessages((prev) => mergeCoreRealtimeMessage(prev, message));
      }
      void refreshLists();
    },
    onReadListsInvalidate: () => {
      void refreshLists();
    },
  });

  const active = items.find((row) => row.id === activeId) ?? null;

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
      {bootError ? <p className="px-3 py-1 text-xs text-red-600">{bootError}</p> : null}
      <div className="flex min-h-0 flex-1">
        {section === 'collections' && !activeCollectionId ? (
          <ClientCollectionsPanel
            collections={collections}
            activeId={activeCollectionId}
            newName={collectionName}
            creating={creatingCollection}
            onNewNameChange={setCollectionName}
            onCreatePersonal={() => void createCollection('PERSONAL')}
            onCreateShared={() => void createCollection('SHARED')}
            onSelect={(id) => void openCollection(id)}
          />
        ) : (
          <ClientConversationList
            section={section}
            items={items}
            activeId={activeId}
            search={search}
            filter={filter}
            provider={provider}
            onSearchChange={setSearch}
            onFilterChange={setFilter}
            onProviderChange={setProvider}
            onSelect={(id) => void openConversation(id)}
            onToggleFavorite={(id) => void toggleFavorite(id)}
          />
        )}
        {active ? (
          <ClientConversationThread
            conversation={active}
            messages={messages}
            messagesLoading={messagesLoading}
            newMessage={newMessage}
            onNewMessageChange={setNewMessage}
            unlockedConversationId={unlockedId}
            onUnlock={() => {
              if (active.canSend) setUnlockedId(active.id);
            }}
            onSend={(replyToMessageId) =>
              void sendClientThreadMessage({
                conversationId: activeId,
                canSend: Boolean(active.canSend),
                unlocked: unlockedId === activeId,
                unlockedConversationId: unlockedId,
                sendBusy,
                content: newMessage,
                replyToMessageId,
                setSendBusy,
                setMessages,
                setNewMessage,
                refreshLists,
              })
            }
            sendDisabled={sendBusy}
            onToggleFavorite={() => void toggleFavorite(active.id)}
            collections={collections}
            onAddToCollection={(collectionId) =>
              void messengerClientApi.addCollectionItem(collectionId, active.id)
            }
            onInvite={async (employeeId) => {
              await messengerClientApi.inviteReadOnly(active.id, employeeId);
            }}
            onAttentionChange={(attention) => {
              setItems((prev) =>
                prev.map((row) => (row.id === active.id ? { ...row, attention } : row)),
              );
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

  async function toggleFavorite(id: string) {
    const result = await messengerClientApi.toggleFavorite(id);
    setItems((prev) =>
      prev.map((row) => (row.id === id ? { ...row, isFavorite: result.favorite } : row)),
    );
  }

  async function createCollection(visibility: 'PERSONAL' | 'SHARED') {
    const name = collectionName.trim();
    if (!name) return;
    setCreatingCollection(true);
    try {
      await messengerClientApi.createCollection({ name, visibility });
      setCollectionName('');
      await refreshLists();
    } finally {
      setCreatingCollection(false);
    }
  }

  async function openCollection(id: string) {
    setActiveCollectionId(id);
    const collection = await messengerClientApi.getCollection(id);
    setItems((collection.conversations ?? []) as MessengerClientConversationRow[]);
    setActiveId(null);
    setMessages([]);
    setUnlockedId(null);
    setNewMessage('');
  }
}

function upsertClientConversation(
  prev: MessengerClientConversationRow[],
  id: string,
  conversation: MessengerClientConversationRow,
): MessengerClientConversationRow[] {
  if (prev.some((row) => row.id === id)) {
    return prev.map((row) => (row.id === id ? { ...row, ...conversation } : row));
  }
  return [conversation, ...prev];
}
