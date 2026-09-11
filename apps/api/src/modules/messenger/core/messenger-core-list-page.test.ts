import { describe, expect, it } from 'vitest';
import { buildInternalUnreadIdSql } from './messenger-core-internal-list-filtered.ops';
import { buildClientFilteredIdSql } from './messenger-core-client-list-filtered.ops';
import { sqlInStrings } from './messenger-core-list-sql';
import {
  encodeMessengerListCursor,
  parseMessengerListCursor,
  sliceMessengerListPage,
} from './messenger-core-list-page';

function sqlBlob(value: unknown): string {
  return JSON.stringify(value);
}

describe('Messenger list page helpers', () => {
  it('slices a truthful page and encodes a stable cursor', () => {
    const page = sliceMessengerListPage(['a', 'b', 'c'], 2);
    expect(page.items).toEqual(['a', 'b']);
    expect(page.hasMore).toBe(true);
    const createdAt = new Date('2026-08-01T10:00:00.000Z');
    const lastMessageAt = new Date('2026-09-05T12:00:00.000Z');
    const encoded = encodeMessengerListCursor({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      createdAt,
      lastMessageAt,
    });
    expect(parseMessengerListCursor(encoded)).toEqual({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      createdAt,
      lastMessageAt,
    });
  });
});

describe('Filtered list SQL', () => {
  it('parameterizes Internal unread search and bounds LIMIT to pageSize+1', () => {
    const fragment = buildInternalUnreadIdSql({
      employeeId: 'e1',
      viewScope: 'OWN',
      grantIds: ['g1'],
      allowedTaskIds: ['task-ok'],
      section: 'groups',
      q: 'hello); drop table messenger_conversations;--',
      take: 3,
    });
    const blob = sqlBlob(fragment);
    expect(blob).toMatch(/LATERAL/i);
    expect(blob).toMatch(/latest\.created_at/i);
    expect(blob).toMatch(/IS DISTINCT FROM/i);
    expect(blob).toMatch(/taskDiscussion/i);
    expect(blob).toContain('hello); drop table messenger_conversations;--');
  });

  it('uses participant-only access SQL when restricted users have no grants', () => {
    const internal = sqlBlob(
      buildInternalUnreadIdSql({
        employeeId: 'e1',
        viewScope: 'OWN',
        grantIds: [],
        allowedTaskIds: [],
        take: 3,
      }),
    );
    const client = sqlBlob(
      buildClientFilteredIdSql({
        employeeId: 'e1',
        clientReadScope: 'ASSIGNED',
        grantIds: [],
        kind: 'unread',
        take: 3,
      }),
    );
    for (const blob of [internal, client]) {
      expect(blob).toMatch(/messenger_conversation_participants/);
      expect(blob).not.toMatch(/NULL::text/);
      expect(blob).not.toMatch(/c\.id IN/);
    }
    expect(internal).toMatch(/c\.type <> 'TASK'/);
    expect(() => sqlInStrings([])).toThrow(/at least one value/);
  });

  it('parameterizes nonempty grant UUIDs without a typed empty subquery', () => {
    const granted = sqlBlob(
      buildInternalUnreadIdSql({
        employeeId: 'e1',
        viewScope: 'OWN',
        grantIds: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'],
        allowedTaskIds: ['task-1'],
        take: 3,
      }),
    );
    expect(granted).toMatch(/c\.id IN/);
    expect(granted).toContain('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    expect(granted).not.toMatch(/NULL::text/);
  });

  it('filters Client needs_response by latest visible inbound direction', () => {
    const fragment = buildClientFilteredIdSql({
      employeeId: 'e1',
      clientReadScope: 'ALL',
      grantIds: [],
      kind: 'needs_response',
      take: 5,
    });
    const blob = sqlBlob(fragment);
    expect(blob).toMatch(/INBOUND/);
    expect(blob).toMatch(/LATERAL/i);
    expect(blob).not.toMatch(/pageSize \* 5/);
  });
});
