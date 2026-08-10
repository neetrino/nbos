'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

export type MessengerL2LoadState = 'idle' | 'loading' | 'success' | 'error';

export function useMessengerNavigation(tab: MessengerInternalTabId, canView: boolean) {
  const [l1Search, setL1Search] = useState('');
  const [entities, setEntities] = useState<MessengerL1EntityRow[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<MessengerL1EntityRow | null>(null);
  const [conversations, setConversations] = useState<MessengerL2ConversationRow[]>([]);
  const [l2State, setL2State] = useState<MessengerL2LoadState>('idle');
  const [l2Error, setL2Error] = useState<string | null>(null);
  const [messageSearch, setMessageSearch] = useState('');
  const [searchResults, setSearchResults] = useState<MessengerUnifiedSearchResultRow[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  const generationRef = useRef(0);
  const selectedEntityRef = useRef<MessengerL1EntityRow | null>(null);
  selectedEntityRef.current = selectedEntity;

  const bumpGeneration = useCallback(() => {
    generationRef.current += 1;
    return generationRef.current;
  }, []);

  const refreshL1 = useCallback(async () => {
    if (!canView) return;
    try {
      setEntities(await messengerApi.listInternalEntities(tab, l1Search || undefined));
      setListError(null);
    } catch {
      setListError('Failed to load entities');
    }
  }, [canView, tab, l1Search]);

  const loadL2ForEntity = useCallback(
    async (entity: MessengerL1EntityRow, generation: number, activeTab: MessengerInternalTabId) => {
      if (entity.entityType === 'DIRECT_BUCKET') {
        const rows = await messengerApi.listInternalConversations({
          entityType: 'DIRECT_BUCKET',
        });
        if (generation !== generationRef.current) return null;
        return rows;
      }
      const rows = await messengerApi.listInternalConversations({
        entityType: entity.entityType,
        entityId: entity.entityId,
        projectTree: activeTab === 'all' && entity.entityType === 'PROJECT',
        // Project Topics must stay project-scoped (no org INTERNAL_GROUP leak).
        includeInternalGroups: false,
      });
      if (generation !== generationRef.current) return null;
      return rows;
    },
    [],
  );

  const refreshL2 = useCallback(async () => {
    const entity = selectedEntityRef.current;
    if (!entity) {
      setConversations([]);
      setL2State('idle');
      setL2Error(null);
      return;
    }
    const generation = generationRef.current;
    setL2State('loading');
    setL2Error(null);
    try {
      const rows = await loadL2ForEntity(entity, generation, tab);
      if (rows === null || generation !== generationRef.current) return;
      setConversations(rows);
      setL2State('success');
    } catch {
      if (generation !== generationRef.current) return;
      setL2State('error');
      setL2Error('Failed to load conversations');
    }
  }, [loadL2ForEntity, tab]);

  useEffect(() => {
    void refreshL1();
  }, [refreshL1]);

  useEffect(() => {
    bumpGeneration();
    setSelectedEntity(null);
    setConversations([]);
    setL2State('idle');
    setL2Error(null);
  }, [tab, bumpGeneration]);

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
      const generation = bumpGeneration();
      setSelectedEntity(entity);
      setConversations([]);
      setL2State('loading');
      setL2Error(null);
      setListError(null);

      if (entity.entityType === 'DIRECT_BUCKET') {
        try {
          const rows = await loadL2ForEntity(entity, generation, tab);
          if (rows === null || generation !== generationRef.current) return null;
          setConversations(rows);
          setL2State('success');
          return null;
        } catch {
          if (generation !== generationRef.current) return null;
          setL2State('error');
          setL2Error('Failed to load conversations');
          return null;
        }
      }

      const ensureType = MESSENGER_ENSURE_TYPE_BY_ENTITY[entity.entityType];
      if (!ensureType) {
        setL2State('idle');
        return null;
      }

      try {
        const ensured = await messengerApi.ensureConversation({
          type: ensureType,
          entityId: entity.entityId,
        });
        if (generation !== generationRef.current) return null;

        const rows = await loadL2ForEntity(entity, generation, tab);
        if (rows === null || generation !== generationRef.current) return null;
        setConversations(rows);
        setL2State('success');
        return ensured.id;
      } catch {
        if (generation !== generationRef.current) return null;
        setL2State('error');
        setL2Error('Failed to open entity chat');
        setListError('Failed to open entity chat');
        return null;
      }
    },
    [bumpGeneration, loadL2ForEntity, tab],
  );

  return {
    l1Search,
    setL1Search,
    entities,
    selectedEntity,
    conversations,
    l2State,
    l2Error,
    messageSearch,
    setMessageSearch,
    searchResults,
    listError,
    setListError,
    refreshL1,
    refreshL2,
    selectEntity,
    bumpGeneration,
  };
}
