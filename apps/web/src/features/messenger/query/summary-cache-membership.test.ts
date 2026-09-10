import { describe, expect, it } from 'vitest';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { clientSummaryMembership, internalSummaryMembership } from './summary-cache-membership';

function row(
  overrides: Partial<MessengerCoreConversationRow> & Pick<MessengerCoreConversationRow, 'type' | 'zone'>,
): MessengerCoreConversationRow {
  return {
    id: 'g1',
    title: 'Group',
    status: 'ACTIVE',
    canonicalKey: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    lastMessageAt: '2026-09-01T00:00:00.000Z',
    unreadCount: 1,
    ...overrides,
  };
}

describe('summary cache membership', () => {
  it('allows Internal all-dataset insert and typed section insert', () => {
    const group = row({ type: 'INTERNAL_GROUP', zone: 'INTERNAL' });
    expect(internalSummaryMembership({ source: 'all-dataset' }, group)).toBe('insert');
    expect(
      internalSummaryMembership(
        { source: 'section', section: 'groups', q: '', filter: 'all' },
        group,
      ),
    ).toBe('insert');
  });

  it('excludes a Group from Products and Tasks', () => {
    const group = row({ type: 'INTERNAL_GROUP', zone: 'INTERNAL' });
    expect(
      internalSummaryMembership(
        { source: 'section', section: 'products', q: '', filter: 'all' },
        group,
      ),
    ).toBe('exclude');
    expect(
      internalSummaryMembership(
        { source: 'section', section: 'tasks', q: '', filter: 'all' },
        group,
      ),
    ).toBe('exclude');
  });

  it('treats Internal search, mentions, and Work Spaces as unknown', () => {
    const group = row({ type: 'INTERNAL_GROUP', zone: 'INTERNAL' });
    expect(
      internalSummaryMembership(
        { source: 'section', section: 'all', q: 'invoice', filter: 'all' },
        group,
      ),
    ).toBe('unknown');
    expect(
      internalSummaryMembership(
        { source: 'section', section: 'all', q: '', filter: 'mentions' },
        group,
      ),
    ).toBe('unknown');
    expect(
      internalSummaryMembership(
        { source: 'section', section: 'workspaces', q: '', filter: 'all' },
        group,
      ),
    ).toBe('unknown');
  });

  it('excludes archived rows from All and typed active sections', () => {
    const archived = row({ type: 'INTERNAL_GROUP', zone: 'INTERNAL', status: 'ARCHIVED' });
    expect(internalSummaryMembership({ source: 'all-dataset' }, archived)).toBe('exclude');
    expect(
      internalSummaryMembership(
        { source: 'section', section: 'groups', q: '', filter: 'all' },
        archived,
      ),
    ).toBe('exclude');
    expect(
      internalSummaryMembership(
        { source: 'section', section: 'direct', q: '', filter: 'all' },
        row({ type: 'DIRECT', zone: 'INTERNAL', status: 'INACTIVE' }),
      ),
    ).toBe('exclude');
  });

  it('never guesses Client Sales, attention, provider, or search membership', () => {
    const client = row({ type: 'EXTERNAL', zone: 'CLIENT', id: 'c1' });
    expect(
      clientSummaryMembership(
        { section: 'inbox', q: '', filter: 'all', provider: '' },
        client,
      ),
    ).toBe('unknown');
    expect(
      clientSummaryMembership(
        { section: 'sales', q: '', filter: 'all', provider: '' },
        client,
      ),
    ).toBe('unknown');
    expect(
      clientSummaryMembership(
        { section: 'inbox', q: '', filter: 'needs_response', provider: '' },
        client,
      ),
    ).toBe('unknown');
    expect(
      clientSummaryMembership(
        { section: 'inbox', q: '', filter: 'all', provider: 'WHATSAPP' },
        client,
      ),
    ).toBe('unknown');
    expect(
      clientSummaryMembership(
        { section: 'clients', q: 'acme', filter: 'all', provider: '' },
        client,
      ),
    ).toBe('unknown');
  });
});
