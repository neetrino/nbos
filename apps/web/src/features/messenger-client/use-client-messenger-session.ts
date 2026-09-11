'use client';

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { useMessengerSessionChrome } from '@/features/messenger/query/messenger-session-chrome';
import type {
  MessengerClientConversationRow,
  MessengerClientListFilter,
  MessengerClientProvider,
  MessengerClientSection,
} from '@/lib/api/messenger-core-client';
import { relockComposerOnConversationChange } from './client-composer-unlock';
import {
  applyClientActiveId,
  applyClientOpenedConversation,
  applyClientSectionChange,
  createClientSessionSnapshot,
  type ClientMessengerSessionSnapshot,
} from './client-section-navigation';

export function useClientMessengerSession(section: MessengerClientSection) {
  const [snapshot, setSnapshot] = useState(() => createClientSessionSnapshot(section));
  const chrome = useMessengerSessionChrome();
  const view =
    snapshot.section === section ? snapshot : applyClientSectionChange(snapshot, section);
  if (view !== snapshot) setSnapshot(view);
  const setters = useClientSessionSetters(setSnapshot);
  return { ...view, ...setters, ...chrome };
}

function useClientSessionSetters(
  setSnapshot: Dispatch<SetStateAction<ClientMessengerSessionSnapshot>>,
) {
  const setNewMessage = useCallback(
    (value: string) => {
      setSnapshot((current) => ({ ...current, newMessage: value }));
    },
    [setSnapshot],
  );
  const setActiveId = useCallback(
    (id: string | null) => {
      setNewMessage('');
      setSnapshot((current) => ({
        ...applyClientActiveId(current, id),
        unlockedId: relockComposerOnConversationChange(current.unlockedId, id),
      }));
    },
    [setNewMessage, setSnapshot],
  );
  const setOpenedConversation = useCallback(
    (row: MessengerClientConversationRow | null) => {
      setSnapshot((current) => applyClientOpenedConversation(current, row));
    },
    [setSnapshot],
  );
  const setActiveCollectionId = useCallback(
    (id: string | null) => {
      setSnapshot((current) => ({ ...current, activeCollectionId: id }));
    },
    [setSnapshot],
  );
  const setSearch = useCallback(
    (value: string) => {
      setSnapshot((current) => ({ ...current, search: value }));
    },
    [setSnapshot],
  );
  const setFilter = useCallback(
    (value: 'all' | MessengerClientListFilter) => {
      setSnapshot((current) => ({ ...current, filter: value }));
    },
    [setSnapshot],
  );
  const setProvider = useCallback(
    (value: '' | MessengerClientProvider) => {
      setSnapshot((current) => ({ ...current, provider: value }));
    },
    [setSnapshot],
  );
  const setUnlockedId = useCallback(
    (id: string | null) => {
      setSnapshot((current) => ({ ...current, unlockedId: id }));
    },
    [setSnapshot],
  );
  return {
    setActiveId,
    setOpenedConversation,
    setActiveCollectionId,
    setSearch,
    setFilter,
    setProvider,
    setNewMessage,
    setUnlockedId,
  };
}
