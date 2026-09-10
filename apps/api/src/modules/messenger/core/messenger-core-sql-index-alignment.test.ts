import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MESSENGER_LIST_ORDER_BY, takeListPagePlusOne } from './messenger-core-list-page';
import { MESSENGER_CORE_INTERNAL_LIST_PAGE_SIZE } from './messenger-core.constants';

const schemaDir = path.resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../../../../../packages/database/prisma/schema',
);

function readSchema(name: string): string {
  return readFileSync(path.join(schemaDir, name), 'utf8');
}

describe('Phase 6 Messenger SQL/index alignment', () => {
  it('list pagination take is pageSize+1 and order matches lastMessageAt/createdAt/id', () => {
    expect(takeListPagePlusOne(MESSENGER_CORE_INTERNAL_LIST_PAGE_SIZE)).toBe(101);
    expect(MESSENGER_LIST_ORDER_BY).toEqual([
      { lastMessageAt: { sort: 'desc', nulls: 'last' } },
      { createdAt: 'desc' },
      { id: 'desc' },
    ]);
  });

  it('conversation list/cursor columns have supporting indexes (no EXPLAIN)', () => {
    const messenger = readSchema('messenger.prisma');
    expect(messenger).toContain('@@index([lastMessageAt])');
    expect(messenger).toContain('@@index([zone, status])');
    expect(messenger).toContain('@@index([conversationId, createdAt])');
    expect(messenger).toContain('@@index([employeeId, leftAt])');
    expect(messenger).toContain('@@index([conversationId, leftAt])');
    expect(messenger).not.toMatch(/@@index\(\[zone,\s*status,\s*lastMessageAt/);
  });

  it('collection membership and favorites indexes match list/item queries', () => {
    const core = readSchema('messenger-core.prisma');
    expect(core).toContain('@@index([ownerEmployeeId, zone])');
    expect(core).toContain('@@index([zone, visibility])');
    expect(core).toContain('@@unique([collectionId, conversationId]');
    expect(core).toContain('@@index([conversationId])');
    expect(core).toContain('@@index([employeeId])');
  });

  it('revision/delta and outbound reconcile indexes match SQL predicates', () => {
    const revision = readSchema('messenger-revision.prisma');
    expect(revision).toContain(
      '@@index([zone, revision, conversationId], map: "messenger_conversation_revisions_zone_revision_idx")',
    );
    expect(revision).toContain(
      '@@index([employeeId, zone, revision, conversationId], map: "messenger_employee_revisions_employee_zone_revision_idx")',
    );
    const core = readSchema('messenger-core.prisma');
    expect(core).toContain(
      '@@index([kind, status, nextReconcileAt], map: "messenger_commands_kind_status_reconcile_idx")',
    );
  });
});
