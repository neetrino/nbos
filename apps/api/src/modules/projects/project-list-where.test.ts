import { describe, expect, it } from 'vitest';
import {
  buildProjectHubViewWhere,
  buildProjectListWhere,
  parseProjectHubView,
} from './project-list-where';

describe('parseProjectHubView', () => {
  it('accepts incoming, active, and closed', () => {
    expect(parseProjectHubView('incoming')).toBe('incoming');
    expect(parseProjectHubView('active')).toBe('active');
    expect(parseProjectHubView('closed')).toBe('closed');
  });

  it('ignores missing and unknown values', () => {
    expect(parseProjectHubView(undefined)).toBeUndefined();
    expect(parseProjectHubView('')).toBeUndefined();
    expect(parseProjectHubView('trash')).toBeUndefined();
  });
});

describe('buildProjectHubViewWhere', () => {
  it('treats empty projects as incoming', () => {
    expect(buildProjectHubViewWhere('incoming')).toEqual({
      products: { none: {} },
      extensions: { none: {} },
    });
  });

  it('treats open delivery or live maintenance as active', () => {
    const where = buildProjectHubViewWhere('active');
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ products: { some: expect.any(Object) } }),
        expect.objectContaining({ extensions: { some: expect.any(Object) } }),
        expect.objectContaining({ subscriptions: { some: expect.any(Object) } }),
      ]),
    );
  });

  it('requires children and no open work for closed', () => {
    const where = buildProjectHubViewWhere('closed');
    expect(where.AND).toEqual(
      expect.arrayContaining([
        { OR: [{ products: { some: {} } }, { extensions: { some: {} } }] },
        expect.objectContaining({ products: { none: expect.any(Object) } }),
        expect.objectContaining({ subscriptions: { none: expect.any(Object) } }),
      ]),
    );
  });
});

describe('buildProjectListWhere', () => {
  it('keeps trash scope and ignores hubView', () => {
    expect(buildProjectListWhere({ scope: 'trash', hubView: 'incoming' })).toEqual({
      trashedAt: { not: null },
    });
  });

  it('applies incoming hubView on the non-trash list', () => {
    expect(buildProjectListWhere({ hubView: 'incoming' })).toEqual({
      trashedAt: null,
      products: { none: {} },
      extensions: { none: {} },
    });
  });

  it('combines hubView and search without colliding OR clauses', () => {
    const where = buildProjectListWhere({ hubView: 'active', search: 'nbos' });
    expect(where.trashedAt).toBeNull();
    expect(where.AND).toEqual([
      expect.objectContaining({ OR: expect.any(Array) }),
      { OR: expect.any(Array) },
    ]);
  });
});
