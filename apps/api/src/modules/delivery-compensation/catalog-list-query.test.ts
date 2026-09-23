import { describe, expect, it } from 'vitest';
import {
  CATALOG_LIST_MAX_PAGE_SIZE,
  buildCatalogListWhere,
  parseCatalogListQuery,
} from './catalog-list-query';

describe('parseCatalogListQuery', () => {
  it('caps page size and ignores unknown status', () => {
    const query = parseCatalogListQuery({
      page: '0',
      pageSize: '999',
      status: 'PAID',
      search: '  warehouse  ',
    });
    expect(query.page).toBe(1);
    expect(query.pageSize).toBe(CATALOG_LIST_MAX_PAGE_SIZE);
    expect(query.status).toBeNull();
    expect(query.search).toBe('warehouse');
  });
});

describe('buildCatalogListWhere', () => {
  it('forces ACTIVE for readers even if a draft status was parsed', () => {
    const query = parseCatalogListQuery({ status: 'DRAFT' });
    expect(buildCatalogListWhere(query, false)).toEqual({ status: 'ACTIVE' });
  });

  it('lets editors filter drafts', () => {
    const query = parseCatalogListQuery({ status: 'DRAFT' });
    expect(buildCatalogListWhere(query, true)).toEqual({ status: 'DRAFT' });
  });

  it('pages unknown categories as Other without listing every known key', () => {
    const query = parseCatalogListQuery({ category: 'other' });
    expect(buildCatalogListWhere(query, true)).toEqual({
      category: { notIn: expect.arrayContaining(['payments', 'commerce']) },
    });
  });
});
