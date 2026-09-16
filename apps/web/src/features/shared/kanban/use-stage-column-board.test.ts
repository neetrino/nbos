import { describe, expect, it } from 'vitest';
import { hasRenderableItems } from './use-stage-column-board';

describe('hasRenderableItems', () => {
  it('treats a reload as a revalidation when a visible column holds rows', () => {
    const buckets = { NEW: { items: [] }, WON: { items: [{ id: 'deal-1' }] } };
    expect(hasRenderableItems(buckets, ['NEW', 'WON'])).toBe(true);
  });

  it('treats a reload as a first load when every visible column is empty', () => {
    const buckets = { NEW: { items: [] }, WON: { items: [] } };
    expect(hasRenderableItems(buckets, ['NEW', 'WON'])).toBe(false);
  });

  it('ignores rows held by columns that are filtered out of the current view', () => {
    const buckets = { NEW: { items: [] }, WON: { items: [{ id: 'deal-1' }] } };
    expect(hasRenderableItems(buckets, ['NEW'])).toBe(false);
  });

  it('treats a stage key with no bucket yet as a first load', () => {
    expect(hasRenderableItems({}, ['NEW'])).toBe(false);
  });
});
