import {
  usesSharedInternalAllDataset,
  type InternalListFilter,
} from '@/features/messenger/query/derive-internal-summaries';
import { commitOpenedConversation } from '@/features/messenger/query/resolve-active-conversation';
import type {
  MessengerCoreConversationRow,
  MessengerInternalSection,
} from '@/lib/api/messenger-core';

export type InternalMessengerSessionSnapshot = {
  section: MessengerInternalSection;
  activeId: string | null;
  openedConversation: MessengerCoreConversationRow | null;
  activeCollectionId: string | null;
  search: string;
  filter: InternalListFilter;
  newMessage: string;
};

export function isInternalInboxSection(section: MessengerInternalSection): boolean {
  return section === 'all' || section === 'tasks';
}

export function isInternalInboxSectionPair(
  previous: MessengerInternalSection,
  next: MessengerInternalSection,
): boolean {
  return isInternalInboxSection(previous) && isInternalInboxSection(next);
}

export function shouldResetInternalSelectionOnSectionChange(
  previous: MessengerInternalSection,
  next: MessengerInternalSection,
): boolean {
  if (previous === next) return false;
  return !isInternalInboxSectionPair(previous, next);
}

export function createInternalSessionSnapshot(
  section: MessengerInternalSection,
): InternalMessengerSessionSnapshot {
  return {
    section,
    activeId: null,
    openedConversation: null,
    activeCollectionId: null,
    search: '',
    filter: 'all',
    newMessage: '',
  };
}

export function applyInternalActiveId(
  state: InternalMessengerSessionSnapshot,
  id: string | null,
): InternalMessengerSessionSnapshot {
  return {
    ...state,
    activeId: id,
    newMessage: id === state.activeId ? state.newMessage : '',
    openedConversation: state.openedConversation?.id === id ? state.openedConversation : null,
  };
}

export function applyInternalOpenedConversation(
  state: InternalMessengerSessionSnapshot,
  row: MessengerCoreConversationRow | null,
): InternalMessengerSessionSnapshot {
  return {
    ...state,
    openedConversation: commitOpenedConversation(state.activeId, state.openedConversation, row),
  };
}

export function applyInternalSectionChange(
  state: InternalMessengerSessionSnapshot,
  nextSection: MessengerInternalSection,
): InternalMessengerSessionSnapshot {
  if (state.section === nextSection) return state;
  if (isInternalInboxSectionPair(state.section, nextSection)) {
    return applyInternalInboxSectionChange(state, nextSection);
  }
  return {
    ...state,
    section: nextSection,
    activeId: null,
    openedConversation: null,
    activeCollectionId: null,
    search: '',
    filter: 'all',
    newMessage: '',
  };
}

function applyInternalInboxSectionChange(
  state: InternalMessengerSessionSnapshot,
  nextSection: MessengerInternalSection,
): InternalMessengerSessionSnapshot {
  const keepSearch = usesSharedInternalAllDataset(nextSection, state.search, state.filter);
  return {
    ...state,
    section: nextSection,
    search: keepSearch ? state.search : '',
    filter: keepSearch ? state.filter : 'all',
    ...retainInternalInboxSelection(state, nextSection),
  };
}

function retainInternalInboxSelection(
  state: InternalMessengerSessionSnapshot,
  nextSection: MessengerInternalSection,
): Pick<InternalMessengerSessionSnapshot, 'activeId' | 'openedConversation' | 'newMessage'> {
  if (nextSection !== 'tasks') {
    return {
      activeId: state.activeId,
      openedConversation: state.openedConversation,
      newMessage: state.newMessage,
    };
  }
  const opened = state.openedConversation;
  if (opened?.type === 'TASK' && opened.id === state.activeId) {
    return {
      activeId: state.activeId,
      openedConversation: opened,
      newMessage: state.newMessage,
    };
  }
  return { activeId: null, openedConversation: null, newMessage: '' };
}
