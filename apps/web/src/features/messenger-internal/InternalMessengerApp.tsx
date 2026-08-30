'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useHeaderModuleTitle } from '@/components/layout/header-context';
import { usePermission } from '@/lib/permissions/PermissionContext';
import {
  messengerCoreApi,
  type MessengerCoreCollectionRow,
  type MessengerCoreConversationRow,
  type MessengerCoreMessageRow,
} from '@/lib/api/messenger-core';
import { INTERNAL_MESSENGER_SHELL_CLASS } from './internal-messenger.constants';
import { sectionFromPathname } from './internal-messenger-section';
import { InternalCollectionsPanel } from './InternalCollectionsPanel';
import { InternalConversationList } from './InternalConversationList';
import { InternalConversationThread } from './InternalConversationThread';
import { InternalMessengerNav } from './InternalMessengerNav';
import { InternalStartBar } from './InternalStartBar';
import { useInternalMessengerRealtime } from './useInternalMessengerRealtime';

export function InternalMessengerApp({ embedded = false }: { embedded?: boolean }) {
  const pathname = usePathname();
  const section = sectionFromPathname(pathname);
  const { me, isLoading: permsLoading, meLoadError, can } = usePermission();
  const canView = can('VIEW', 'MESSENGER');
  const canEdit = can('EDIT', 'MESSENGER');
  useHeaderModuleTitle('Internal Messenger', !embedded);

  const [items, setItems] = useState<MessengerCoreConversationRow[]>([]);
  const [collections, setCollections] = useState<MessengerCoreCollectionRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessengerCoreMessageRow[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'mentions'>('all');
  const [newMessage, setNewMessage] = useState('');
  const [sendBusy, setSendBusy] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  const refreshLists = useCallback(async () => {
    const collectionRows = await messengerCoreApi.listCollections();
    setCollections(collectionRows);
    if (section === 'collections') return;
    const result = await messengerCoreApi.listConversations({
      section,
      q: search.trim() || undefined,
      filter: filter === 'all' ? undefined : filter,
    });
    setItems(result.items);
  }, [section, search, filter]);

  useEffect(() => {
    setActiveId(null);
    setActiveCollectionId(null);
    setMessages([]);
    setItems([]);
    setSearch('');
    setFilter('all');
  }, [section]);

  useEffect(() => {
    if (!canView || !me) return;
    void refreshLists().catch(() => setBootError('Could not load Internal Messenger.'));
  }, [canView, me, refreshLists]);

  const openConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setMessagesLoading(true);
    try {
      const [conversation, page] = await Promise.all([
        messengerCoreApi.getConversation(id),
        messengerCoreApi.listMessages(id),
      ]);
      setItems((prev) => prev.map((row) => (row.id === id ? { ...row, ...conversation } : row)));
      setMessages(page.items);
      await messengerCoreApi.markRead(id);
    } catch {
      setBootError('Could not open that Internal conversation.');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useInternalMessengerRealtime({
    canViewMessenger: canView,
    meId: me?.id,
    conversationId: activeId,
    onInboundMessage: (conversationId, message) => {
      if (conversationId === activeId) {
        setMessages((prev) =>
          prev.some((row) => row.id === message.id) ? prev : [...prev, message],
        );
      }
      void refreshLists();
    },
    onReadListsInvalidate: () => {
      void refreshLists();
    },
  });

  const active = items.find((row) => row.id === activeId) ?? null;

  async function send() {
    if (!activeId || !active?.canWrite || sendBusy) return;
    const content = newMessage.trim();
    if (!content) return;
    setSendBusy(true);
    try {
      const message = await messengerCoreApi.sendMessage(activeId, { content });
      setMessages((prev) =>
        prev.some((row) => row.id === message.id) ? prev : [...prev, message],
      );
      setNewMessage('');
      await refreshLists();
    } finally {
      setSendBusy(false);
    }
  }

  async function toggleFavorite(id: string) {
    const result = await messengerCoreApi.toggleFavorite(id);
    setItems((prev) =>
      prev.map((row) => (row.id === id ? { ...row, isFavorite: result.favorite } : row)),
    );
  }

  if (permsLoading) {
    return <div className={INTERNAL_MESSENGER_SHELL_CLASS} />;
  }
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
      <InternalMessengerNav section={section} />
      <InternalStartBar
        section={section}
        canEdit={canEdit}
        onCreateGroup={async (title) => {
          const created = await messengerCoreApi.createConversation({
            type: 'INTERNAL_GROUP',
            title,
          });
          await refreshLists();
          await openConversation(created.id);
        }}
        onStartDirect={async (peerEmployeeId) => {
          const created = await messengerCoreApi.createConversation({
            type: 'DIRECT',
            peerEmployeeId,
          });
          await refreshLists();
          await openConversation(created.id);
        }}
      />
      {bootError ? <p className="px-3 py-1 text-xs text-red-600">{bootError}</p> : null}
      <div className="flex min-h-0 flex-1">
        {section === 'collections' && !activeCollectionId ? (
          <InternalCollectionsPanel
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
          <InternalConversationList
            section={section}
            items={items}
            activeId={activeId}
            search={search}
            filter={filter}
            onSearchChange={setSearch}
            onFilterChange={setFilter}
            onSelect={(id) => void openConversation(id)}
            onToggleFavorite={(id) => void toggleFavorite(id)}
          />
        )}
        {active ? (
          <InternalConversationThread
            conversation={active}
            messages={messages}
            messagesLoading={messagesLoading}
            newMessage={newMessage}
            onNewMessageChange={setNewMessage}
            onSend={() => void send()}
            canSend={Boolean(active.canWrite)}
            sendDisabled={sendBusy}
            onToggleFavorite={() => void toggleFavorite(active.id)}
            collections={collections}
            onAddToCollection={(collectionId) =>
              void messengerCoreApi.addCollectionItem(collectionId, active.id)
            }
            remoteTypingHint={null}
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
    const name = collectionName.trim();
    if (!name) return;
    setCreatingCollection(true);
    try {
      await messengerCoreApi.createCollection({ name, visibility });
      setCollectionName('');
      await refreshLists();
    } finally {
      setCreatingCollection(false);
    }
  }

  async function openCollection(id: string) {
    setActiveCollectionId(id);
    const collection = await messengerCoreApi.getCollection(id);
    setItems(collection.conversations ?? []);
    setActiveId(null);
    setMessages([]);
  }
}
