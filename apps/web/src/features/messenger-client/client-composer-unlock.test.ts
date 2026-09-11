import { describe, expect, it } from 'vitest';
import {
  canUnlockClientComposer,
  isClientComposerUnlocked,
  isClientSendReady,
  relockComposerOnConversationChange,
} from './client-composer-unlock';
import {
  applyClientSectionChange,
  clientComposerAfterSectionChange,
  createClientSessionSnapshot,
} from './client-section-navigation';
import {
  CLIENT_COMPOSER_DRAFT_STORE_KEY,
  INTERNAL_COMPOSER_DRAFT_STORE_KEY,
} from './client-messenger.constants';

describe('Client locked composer', () => {
  it('relocks when the conversation id changes or the route leaves the thread', () => {
    expect(relockComposerOnConversationChange('conv-a', 'conv-b')).toBeNull();
    expect(relockComposerOnConversationChange('conv-a', null)).toBeNull();
    expect(relockComposerOnConversationChange('conv-a', 'conv-a')).toBe('conv-a');
  });

  it('does not treat another conversation as unlocked', () => {
    expect(isClientComposerUnlocked('conv-a', 'conv-b')).toBe(false);
    expect(isClientComposerUnlocked('conv-a', 'conv-a')).toBe(true);
  });

  it('never unlocks a READ-only user', () => {
    expect(canUnlockClientComposer(false)).toBe(false);
    expect(
      isClientSendReady({
        unlocked: true,
        canSend: false,
        conversationId: 'conv-a',
        unlockedConversationId: 'conv-a',
      }),
    ).toBe(false);
  });

  it('relocks on section change even when the conversation id stays the same', () => {
    const next = applyClientSectionChange(
      {
        ...createClientSessionSnapshot('inbox'),
        activeId: 'conv-a',
        unlockedId: 'conv-a',
        newMessage: 'draft',
      },
      'clients',
    );
    expect(relockComposerOnConversationChange('conv-a', 'conv-a')).toBe('conv-a');
    expect(clientComposerAfterSectionChange()).toEqual({ unlockedId: null, newMessage: '' });
    expect(next.activeId).toBeNull();
    expect(next.openedConversation).toBeNull();
    expect(next.unlockedId).toBeNull();
    expect(next.newMessage).toBe('');
  });

  it('does not share Internal draft storage as Client send-ready text', () => {
    expect(CLIENT_COMPOSER_DRAFT_STORE_KEY).not.toBe(INTERNAL_COMPOSER_DRAFT_STORE_KEY);
    expect(CLIENT_COMPOSER_DRAFT_STORE_KEY).toContain('client-messenger');
    expect(INTERNAL_COMPOSER_DRAFT_STORE_KEY).toContain('internal-messenger');
  });
});
