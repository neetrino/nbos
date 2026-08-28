import { describe, expect, it } from 'vitest';
import {
  directoryHasMorePage,
  whatsappDirectoryItemKind,
} from './whatsapp-gateway-directory';

describe('whatsappDirectoryItemKind', () => {
  it('classifies group and chat JIDs', () => {
    expect(whatsappDirectoryItemKind('120363321882452919@g.us')).toBe('group');
    expect(whatsappDirectoryItemKind('37499123456@c.us')).toBe('chat');
  });
});

describe('directoryHasMorePage', () => {
  it('treats a full page as having more items', () => {
    expect(directoryHasMorePage(20, 20)).toBe(true);
    expect(directoryHasMorePage(7, 20)).toBe(false);
  });
});
