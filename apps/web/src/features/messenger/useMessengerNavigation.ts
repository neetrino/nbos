'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  messengerApi,
  type MessengerL1EntityRow,
  type MessengerL2ConversationRow,
  type MessengerUnifiedSearchResultRow,
} from '@/lib/api/messenger';
import {
  MESSENGER_ENSURE_TYPE_BY_ENTITY,
  type MessengerInternalTabId,
} from './messenger-internal.constants';

export function useMessengerNavigation(tab: MessengerInternalTabId, canView: boolean) {
  const [l1Search, setL1Search] = useState('');
  const [entities, setEntities] = useState<MessengerL1EntityRow[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<MessengerL1EntityRow | null>(null);
  const [conversations, setConversations] = useState<MessengerL2ConversationRow[]>([]);
  const [messageSearch, setMessageSearch] = useState('');
  const [searchResults, setSearchResults] = useState<MessengerUnifiedSearchResultRow[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  const refreshL1 = useCallback(async () => {
    if (!canView) return;
    try {
      setEntities(await messengerApi.listInternalEntities(tab, l1Search || undefined));
      setListError(null);
    } catch {
      setListError('Failed to load entities');
    }
  }, [canView, tab, l1Search]);

  const refreshL2 = useCallback(async () => {
    if (!selectedEntity) {
      setConversations([]);
      return;
    }
    try {
      if (selectedEntity.entityType === 'DIRECT_BUCKET') {
        setConversations(
          await messengerApi.listInternalConversations({ entityType: 'DIRECT_BUCKET' }),
        );
        return;
      }
      setConversations(
        await messengerApi.listInternalConversations({
          entityType: selectedEntity.entityType,
          entityId: selectedEntity.entityId,
          projectTree: tab === 'all' && selectedEntity.entityType === 'PROJECT',
          includeInternalGroups: tab === 'all',
        }),
      );
    } catch {
      setListError('Failed to load conversations');
    }
  }, [selectedEntity, tab]);

  useEffect(() => {
    void refreshL1();
  }, [refreshL1]);

  useEffect(() => {
    setSelectedEntity(null);
    setConversations([]);
  }, [tab]);

  useEffect(() => {
    if (!selectedEntity) return;
    void refreshL2();
  }, [selectedEntity, refreshL2]);

  useEffect(() => {
    if (messageSearch.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const handle = setTimeout(() => {
      void messengerApi.searchInternal(messageSearch.trim()).then((res) => {
        setSearchResults(res.items);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [messageSearch]);

  const selectEntity = useCallback(
    async (entity: MessengerL1EntityRow): Promise<string | null> => {
      setSelectedEntity(entity);
      if (entity.entityType === 'DIRECT_BUCKET') return null;
      const ensureType = MESSENGER_ENSURE_TYPE_BY_ENTITY[entity.entityType];
      if (!ensureType) return null;
      try {
        const ensured = await messengerApi.ensureConversation({
          type: ensureType,
          entityId: entity.entityId,
        });
        void refreshL2();
        return ensured.id;
      } catch {
        setListError('Failed to open entity chat');
        return null;
      }
    },
    [refreshL2],
  );

  return {
    l1Search,
    setL1Search,
    entities,
    selectedEntity,
    conversations,
    messageSearch,
    setMessageSearch,
    searchResults,
    listError,
    setListError,
    refreshL1,
    refreshL2,
    selectEntity,
  };
}
