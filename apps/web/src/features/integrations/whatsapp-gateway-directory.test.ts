import { describe, expect, it } from 'vitest';
import { directoryHasMorePage, resolveDirectoryChatType } from './whatsapp-gateway-directory';

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
    expect(directoryHasMorePage(20, 20)).toBe(true);
    expect(directoryHasMorePage(7, 20)).toBe(false);
  });
});
