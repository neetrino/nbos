import { describe, expect, it } from 'vitest';
import { MAIL_THREAD_LIST_MAX_PAGE_SIZE } from './mail-thread-list-pagination.constants';
import {
  buildMailThreadListPageMeta,
  normalizeMailThreadListPagination,
  parseMailThreadListIntQuery,
} from './mail-thread-list-pagination.ops';

describe('parseMailThreadListIntQuery', () => {
  it('returns undefined for empty input', () => {
    expect(parseMailThreadListIntQuery(undefined)).toBeUndefined();
    expect(parseMailThreadListIntQuery('')).toBeUndefined();
  });

  it('parses valid integers', () => {
    expect(parseMailThreadListIntQuery('2')).toBe(2);
  });
});

describe('normalizeMailThreadListPagination', () => {
  it('applies defaults', () => {
    expect(normalizeMailThreadListPagination({})).toEqual({
      page: 1,
      pageSize: 50,
      skip: 0,
    });
  });

  it('caps page size', () => {
    const { pageSize } = normalizeMailThreadListPagination({ pageSize: 999 });
    expect(pageSize).toBe(MAIL_THREAD_LIST_MAX_PAGE_SIZE);
  });
});

describe('buildMailThreadListPageMeta', () => {
  it('computes paging flags', () => {
    const meta = buildMailThreadListPageMeta({ page: 2, pageSize: 10, totalCount: 25 });
    expect(meta.totalPages).toBe(3);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPreviousPage).toBe(true);
  });
});
