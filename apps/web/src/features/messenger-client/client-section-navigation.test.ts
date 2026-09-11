import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyClientActiveId,
  applyClientOpenedConversation,
  applyClientSectionChange,
  clientComposerAfterSectionChange,
  createClientSessionSnapshot,
  relockComposerOnSectionChange,
} from './client-section-navigation';

describe('Client section navigation', () => {
  it('relocks the composer and clears a send-ready draft on section change', () => {
    const current = {
      ...createClientSessionSnapshot('inbox'),
      activeId: 'c1',
      unlockedId: 'c1',
      newMessage: 'ready to send',
      search: 'acme',
    };
    const next = applyClientSectionChange(current, 'sales');
    expect(relockComposerOnSectionChange()).toBeNull();
    expect(clientComposerAfterSectionChange()).toEqual({ unlockedId: null, newMessage: '' });
    expect(next.unlockedId).toBeNull();
    expect(next.newMessage).toBe('');
    expect(next.activeId).toBeNull();
    expect(next.openedConversation).toBeNull();
    expect(next.search).toBe('');
  });

  it('does not remount Client Messenger on section', () => {
    const source = readFileSync(path.join(__dirname, 'ClientMessengerApp.tsx'), 'utf8');
    expect(source).not.toMatch(/key=\{section\}/);
  });

  it('ignores a late opened row after the active conversation has changed', () => {
    const first = {
      id: 'A',
      zone: 'CLIENT' as const,
      type: 'EXTERNAL' as const,
      title: 'A',
      status: 'ACTIVE',
      canonicalKey: null,
      createdAt: '2026-09-01T00:00:00.000Z',
      lastMessageAt: '2026-09-01T00:00:00.000Z',
    };
    const second = { ...first, id: 'B', title: 'B' };
    let state = applyClientActiveId(createClientSessionSnapshot('inbox'), 'A');
    state = applyClientOpenedConversation(state, first);
    state = applyClientActiveId(state, 'B');
    state = applyClientOpenedConversation(state, second);
    state = applyClientOpenedConversation(state, first);
    expect(state.activeId).toBe('B');
    expect(state.openedConversation?.id).toBe('B');
  });
});
