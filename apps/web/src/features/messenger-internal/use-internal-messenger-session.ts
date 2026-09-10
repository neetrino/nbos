'use client';

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { useMessengerSessionChrome } from '@/features/messenger/query/messenger-session-chrome';
import type { InternalListFilter } from '@/features/messenger/query/derive-internal-summaries';
import type {
  MessengerCoreConversationRow,
  MessengerInternalSection,
} from '@/lib/api/messenger-core';
import {
  applyInternalActiveId,
  applyInternalOpenedConversation,
  applyInternalSectionChange,
  createInternalSessionSnapshot,
  type InternalMessengerSessionSnapshot,
} from './internal-section-navigation';

export function useInternalMessengerSession(section: MessengerInternalSection) {
  const [snapshot, setSnapshot] = useState(() => createInternalSessionSnapshot(section));
  const chrome = useMessengerSessionChrome();
  const view =
    snapshot.section === section ? snapshot : applyInternalSectionChange(snapshot, section);
  if (view !== snapshot) setSnapshot(view);
  const setters = useInternalSessionSetters(setSnapshot);
  return { ...view, ...setters, ...chrome };
}

function useInternalSessionSetters(
  setSnapshot: Dispatch<SetStateAction<InternalMessengerSessionSnapshot>>,
) {
  const setActiveId = useCallback((id: string | null) => {
    setSnapshot((current) => applyInternalActiveId(current, id));
  }, [setSnapshot]);
  const setOpenedConversation = useCallback((row: MessengerCoreConversationRow | null) => {
    setSnapshot((current) => applyInternalOpenedConversation(current, row));
  }, [setSnapshot]);
  const setActiveCollectionId = useCallback((id: string | null) => {
    setSnapshot((current) => ({ ...current, activeCollectionId: id }));
  }, [setSnapshot]);
  const setSearch = useCallback((value: string) => {
    setSnapshot((current) => ({ ...current, search: value }));
  }, [setSnapshot]);
  const setFilter = useCallback((value: InternalListFilter) => {
    setSnapshot((current) => ({ ...current, filter: value }));
  }, [setSnapshot]);
  const setNewMessage = useCallback((value: string) => {
    setSnapshot((current) => ({ ...current, newMessage: value }));
  }, [setSnapshot]);
  return {
    setActiveId,
    setOpenedConversation,
    setActiveCollectionId,
    setSearch,
    setFilter,
    setNewMessage,
  };
}
