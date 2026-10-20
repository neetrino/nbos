import { describe, expect, it } from 'vitest';
import {
  summarizeDomainRegistryBulkPage,
  type DomainRegistryBulkOutcome,
} from './domain-registry-bulk.summary';

const PAGE = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

function outcomes(
  entries: Array<[string, DomainRegistryBulkOutcome]>,
): Map<string, DomainRegistryBulkOutcome> {
  return new Map(entries);
}

describe('summarizeDomainRegistryBulkPage', () => {
  it('finishes the run when the whole last page is checked', () => {
    const result = summarizeDomainRegistryBulkPage({
      page: PAGE,
      outcomes: outcomes([
        ['a', 'updated'],
        ['b', 'unchanged'],
        ['c', 'skipped'],
      ]),
      total: 3,
      cursor: null,
      pageHasMore: false,
    });
    expect(result).toMatchObject({ total: 3, checked: 3, nextCursor: 'c', done: true });
    expect(result.counts).toMatchObject({ updated: 1, unchanged: 1, skipped: 1, failed: 0 });
  });

  it('advances the cursor only over the finished prefix', () => {
    const result = summarizeDomainRegistryBulkPage({
      page: PAGE,
      outcomes: outcomes([
        ['a', 'not_found'],
        ['c', 'updated'],
      ]),
      total: 10,
      cursor: 'prev',
      pageHasMore: false,
    });
    expect(result).toMatchObject({ checked: 1, nextCursor: 'a', done: false });
    expect(result.counts).toMatchObject({ not_found: 1, updated: 0 });
  });

  it('keeps going when the page is finished but more rows exist', () => {
    const result = summarizeDomainRegistryBulkPage({
      page: PAGE,
      outcomes: outcomes([
        ['a', 'failed'],
        ['b', 'failed'],
        ['c', 'no_expiry'],
      ]),
      total: 100,
      cursor: null,
      pageHasMore: true,
    });
    expect(result).toMatchObject({ checked: 3, nextCursor: 'c', done: false });
  });

  it('reports done on an empty scope', () => {
    const result = summarizeDomainRegistryBulkPage({
      page: [],
      outcomes: outcomes([]),
      total: 0,
      cursor: null,
      pageHasMore: false,
    });
    expect(result).toMatchObject({ total: 0, checked: 0, nextCursor: null, done: true });
  });
});
