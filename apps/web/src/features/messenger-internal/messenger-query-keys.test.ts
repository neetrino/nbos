import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import {
  internalSummariesQueryKey,
  usesSharedInternalAllDataset,
} from '@/features/messenger/query/derive-internal-summaries';

describe('messengerQueryKeys', () => {
  it('keeps Internal summaries, Client summaries, Collections, and messages separate', () => {
    expect(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })).toEqual([
      'messenger',
      'internal',
      'summaries',
      { source: 'all-dataset' },
    ]);
    expect(
      messengerQueryKeys.clientSummaries({
        section: 'inbox',
        q: '',
        filter: 'all',
        provider: '',
      })[1],
    ).toBe('client');
    expect(messengerQueryKeys.collections('INTERNAL')).toEqual([
      'messenger',
      'collections',
      'INTERNAL',
    ]);
    expect(messengerQueryKeys.collections('CLIENT')).toEqual([
      'messenger',
      'collections',
      'CLIENT',
    ]);
    expect(messengerQueryKeys.messages('conv-1')).toEqual(['messenger', 'messages', 'conv-1']);
  });

  it('uses one All-dataset key for Internal All and Tasks', () => {
    expect(usesSharedInternalAllDataset('all', '', 'all')).toBe(true);
    expect(usesSharedInternalAllDataset('tasks', '', 'all')).toBe(true);
    expect(internalSummariesQueryKey('all', '', 'all')).toEqual(
      internalSummariesQueryKey('tasks', '', 'all'),
    );
    expect(usesSharedInternalAllDataset('all', '', 'unread')).toBe(false);
    expect(usesSharedInternalAllDataset('tasks', '', 'unread')).toBe(false);
    expect(internalSummariesQueryKey('all', '', 'unread')).not.toEqual(
      internalSummariesQueryKey('tasks', '', 'unread'),
    );
    expect(internalSummariesQueryKey('all', '', 'unread')).toEqual(
      messengerQueryKeys.internalSummaries({
        source: 'section',
        section: 'all',
        q: '',
        filter: 'unread',
      }),
    );
  });

  it('does not share the All dataset for search, mentions, or Work Spaces', () => {
    expect(usesSharedInternalAllDataset('all', 'invoice', 'all')).toBe(false);
    expect(usesSharedInternalAllDataset('tasks', '', 'mentions')).toBe(false);
    expect(usesSharedInternalAllDataset('workspaces', '', 'all')).toBe(false);
    expect(internalSummariesQueryKey('all', '', 'all')).not.toEqual(
      internalSummariesQueryKey('all', 'invoice', 'all'),
    );
    expect(internalSummariesQueryKey('workspaces', '', 'all')).not.toEqual(
      internalSummariesQueryKey('all', '', 'all'),
    );
  });

  it('keeps Collections independent of list search and filter', () => {
    const collections = messengerQueryKeys.collections('INTERNAL');
    const searched = internalSummariesQueryKey('all', 'hello', 'unread');
    expect(collections).not.toEqual(searched);
    expect(JSON.stringify(collections)).not.toContain('hello');
    expect(JSON.stringify(collections)).not.toContain('unread');
    const collectionsHook = readFileSync(
      path.join(
        process.cwd(),
        'apps/web/src/features/messenger/query/use-messenger-collections.ts',
      ),
      'utf8',
    );
    expect(collectionsHook).not.toMatch(/search/);
    expect(collectionsHook).not.toMatch(/filter/);
  });

  it('converges Task, entity, and Messenger threads on conversationId', () => {
    const conversationId = 'conv-task-1';
    expect(messengerQueryKeys.messages(conversationId)).toEqual([
      'messenger',
      'messages',
      conversationId,
    ]);
    expect(messengerQueryKeys.internalEntity('product', 'p1')).not.toEqual(
      messengerQueryKeys.messages(conversationId),
    );
  });
});
