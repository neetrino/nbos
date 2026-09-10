import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { MessengerCoreConversationRow, MessengerCoreConversationType } from '@/lib/api/messenger-core';
import { resolveActiveConversation } from '@/features/messenger/query/resolve-active-conversation';
import {
  applyInternalActiveId,
  applyInternalOpenedConversation,
  applyInternalSectionChange,
  createInternalSessionSnapshot,
  shouldResetInternalSelectionOnSectionChange,
} from './internal-section-navigation';

function row(
  id: string,
  type: MessengerCoreConversationType = 'INTERNAL_GROUP',
): MessengerCoreConversationRow {
  return {
    id,
    zone: 'INTERNAL',
    type,
    title: id,
    status: 'ACTIVE',
    canonicalKey: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    lastMessageAt: '2026-09-01T00:00:00.000Z',
  };
}

describe('Internal section navigation', () => {
  it('keeps a Task thread across All ↔ Tasks and does not remount', () => {
    const opened = row('t1', 'TASK');
    const current = {
      ...createInternalSessionSnapshot('all'),
      activeId: 't1',
      openedConversation: opened,
      newMessage: 'draft',
    };
    const next = applyInternalSectionChange(current, 'tasks');
    expect(shouldResetInternalSelectionOnSectionChange('all', 'tasks')).toBe(false);
    expect(next.activeId).toBe('t1');
    expect(next.openedConversation).toBe(opened);
    expect(next.newMessage).toBe('draft');
    expect(applyInternalSectionChange(next, 'all').activeId).toBe('t1');
    const source = readFileSync(path.join(__dirname, 'InternalMessengerApp.tsx'), 'utf8');
    expect(source).not.toMatch(/key=\{section\}/);
  });

  it('clears a non-Task or unknown selection when entering Tasks', () => {
    const group = {
      ...createInternalSessionSnapshot('all'),
      activeId: 'g1',
      openedConversation: row('g1'),
      newMessage: 'draft',
    };
    const cleared = applyInternalSectionChange(group, 'tasks');
    expect(cleared.activeId).toBeNull();
    expect(cleared.openedConversation).toBeNull();
    expect(cleared.newMessage).toBe('');
    const unknown = applyInternalSectionChange(
      { ...createInternalSessionSnapshot('all'), activeId: 'maybe-task', newMessage: 'draft' },
      'tasks',
    );
    expect(unknown.activeId).toBeNull();
    expect(unknown.openedConversation).toBeNull();
    expect(unknown.newMessage).toBe('');
  });

  it('clears selection and draft when leaving the All/Tasks pair', () => {
    const current = {
      ...createInternalSessionSnapshot('all'),
      activeId: 'g1',
      openedConversation: row('g1'),
      search: 'invoice',
      newMessage: 'draft',
    };
    const next = applyInternalSectionChange(current, 'products');
    expect(shouldResetInternalSelectionOnSectionChange('all', 'products')).toBe(true);
    expect(next.activeId).toBeNull();
    expect(next.openedConversation).toBeNull();
    expect(next.search).toBe('');
    expect(next.newMessage).toBe('');
  });

  it('clears the Internal draft when the active conversation is cleared', () => {
    const current = {
      ...createInternalSessionSnapshot('all'),
      activeId: 'g1',
      openedConversation: row('g1'),
      newMessage: 'draft',
    };
    const next = applyInternalActiveId(current, null);
    expect(next.activeId).toBeNull();
    expect(next.openedConversation).toBeNull();
    expect(next.newMessage).toBe('');
  });

  it('ignores a late opened row after the active conversation has changed', () => {
    const first = row('A');
    const second = row('B');
    let state = applyInternalActiveId(createInternalSessionSnapshot('all'), 'A');
    state = applyInternalOpenedConversation(state, first);
    state = applyInternalActiveId(state, 'B');
    state = applyInternalOpenedConversation(state, second);
    state = applyInternalOpenedConversation(state, first);
    expect(state.activeId).toBe('B');
    expect(state.openedConversation?.id).toBe('B');
    expect(resolveActiveConversation([first], 'B', state.openedConversation)?.id).toBe('B');
  });
});
