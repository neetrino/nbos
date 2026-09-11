import { commitOpenedConversation } from '@/features/messenger/query/resolve-active-conversation';
import type {
  MessengerClientConversationRow,
  MessengerClientListFilter,
  MessengerClientProvider,
  MessengerClientSection,
} from '@/lib/api/messenger-core-client';
import { relockComposerOnConversationChange } from './client-composer-unlock';

export type ClientMessengerSessionSnapshot = {
  section: MessengerClientSection;
  activeId: string | null;
  openedConversation: MessengerClientConversationRow | null;
  activeCollectionId: string | null;
  search: string;
  filter: 'all' | MessengerClientListFilter;
  provider: '' | MessengerClientProvider;
  newMessage: string;
  unlockedId: string | null;
};

export function relockComposerOnSectionChange(): null {
  return null;
}

export function clientComposerAfterSectionChange(): {
  unlockedId: null;
  newMessage: '';
} {
  return {
    unlockedId: relockComposerOnSectionChange(),
    newMessage: '',
  };
}

export function createClientSessionSnapshot(
  section: MessengerClientSection,
): ClientMessengerSessionSnapshot {
  return {
    section,
    activeId: null,
    openedConversation: null,
    activeCollectionId: null,
    search: '',
    filter: 'all',
    provider: '',
    newMessage: '',
    unlockedId: null,
  };
}

export function applyClientActiveId(
  state: ClientMessengerSessionSnapshot,
  id: string | null,
): ClientMessengerSessionSnapshot {
  return {
    ...state,
    activeId: id,
    newMessage: '',
    unlockedId: relockComposerOnConversationChange(state.unlockedId, id),
    openedConversation: state.openedConversation?.id === id ? state.openedConversation : null,
  };
}

export function applyClientOpenedConversation(
  state: ClientMessengerSessionSnapshot,
  row: MessengerClientConversationRow | null,
): ClientMessengerSessionSnapshot {
  return {
    ...state,
    openedConversation: commitOpenedConversation(state.activeId, state.openedConversation, row),
  };
}

export function applyClientSectionChange(
  state: ClientMessengerSessionSnapshot,
  nextSection: MessengerClientSection,
): ClientMessengerSessionSnapshot {
  if (state.section === nextSection) return state;
  return {
    ...state,
    section: nextSection,
    activeId: null,
    openedConversation: null,
    activeCollectionId: null,
    search: '',
    filter: 'all',
    provider: '',
    ...clientComposerAfterSectionChange(),
  };
}
