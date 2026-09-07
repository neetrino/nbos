import { describe, expect, it } from 'vitest';
import {
  directoryHasMorePage,
  groupsPageToDirectoryPage,
  resolveDirectoryChatType,
} from './whatsapp-gateway-directory';

describe('resolveDirectoryChatType', () => {
  it('prefers Gateway type when present', () => {
    expect(resolveDirectoryChatType('120363321882452919@g.us', 'group')).toBe('group');
    expect(resolveDirectoryChatType('37499123456@c.us', 'direct')).toBe('direct');
  });

  it('falls back to JID suffix', () => {
    expect(resolveDirectoryChatType('120363321882452919@g.us')).toBe('group');
    expect(resolveDirectoryChatType('37499123456@c.us')).toBe('direct');
  });
});

describe('directoryHasMorePage', () => {
  it('treats a full page as having more items', () => {
    expect(directoryHasMorePage(50, 50)).toBe(true);
    expect(directoryHasMorePage(7, 50)).toBe(false);
  });
});

describe('groupsPageToDirectoryPage', () => {
  it('maps Gateway groups to directory chat items', () => {
    expect(
      groupsPageToDirectoryPage({
        groups: [{ id: '120363408874132550@g.us', name: 'APP' }],
        pagination: { limit: 50, offset: 0, count: 1 },
      }),
    ).toEqual({
      items: [{ id: '120363408874132550@g.us', name: 'APP', type: 'group' }],
      pagination: { limit: 50, offset: 0, count: 1 },
    });
  });
});
