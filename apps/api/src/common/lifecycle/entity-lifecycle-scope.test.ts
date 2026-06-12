import { describe, expect, it } from 'vitest';
import {
  buildDriveRecoverableTrashWhere,
  buildScopeWhere,
  buildTimestampScopeWhere,
  parseLifecycleScopeFromQuery,
} from './entity-lifecycle-scope';

describe('buildTimestampScopeWhere', () => {
  it('active excludes trashed rows', () => {
    expect(buildTimestampScopeWhere('active', 'archivedAt')).toEqual({ archivedAt: null });
  });

  it('trash includes only trashed rows', () => {
    expect(buildTimestampScopeWhere('trash', 'deletedAt')).toEqual({
      deletedAt: { not: null },
    });
  });
});

describe('buildScopeWhere', () => {
  it('defaults to trashedAt target field', () => {
    expect(buildScopeWhere('active')).toEqual({ trashedAt: null });
  });
});

describe('parseLifecycleScopeFromQuery', () => {
  it('prefers scope param', () => {
    expect(parseLifecycleScopeFromQuery('trash', false)).toBe('trash');
  });

  it('maps legacy include flag to trash', () => {
    expect(parseLifecycleScopeFromQuery(undefined, true)).toBe('trash');
  });
});

describe('buildDriveRecoverableTrashWhere', () => {
  it('includes archived and deleted transitional states', () => {
    const where = buildDriveRecoverableTrashWhere();
    expect(where.OR).toHaveLength(2);
  });
});
