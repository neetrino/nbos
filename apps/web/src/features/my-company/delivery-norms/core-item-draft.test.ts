import { describe, expect, it } from 'vitest';
import type { CoreItemDto } from '@/lib/api/delivery-catalog-structure';
import {
  addCoreItemDraft,
  coreItemDraftsFromDto,
  emptyNoteToNull,
  moveCoreItemDraft,
  removeCoreItemDraft,
  replaceCoreItemDraft,
  toCoreItemInputs,
  type CoreItemDraft,
} from './core-item-draft';

const CATALOG: CoreItemDraft[] = [
  { key: 'a', label: 'Home', note: 'hero' },
  { key: 'b', label: 'Catalog', note: '' },
];

describe('emptyNoteToNull', () => {
  it('maps blank and whitespace to null', () => {
    expect(emptyNoteToNull('')).toBeNull();
    expect(emptyNoteToNull('   ')).toBeNull();
  });

  it('keeps a real note', () => {
    expect(emptyNoteToNull('  up to three levels  ')).toBe('up to three levels');
  });
});

describe('coreItemDraftsFromDto', () => {
  it('copies label and turns a missing note into an empty field', () => {
    const items: CoreItemDto[] = [
      { id: '1', position: 1, label: 'Home', note: null },
      { id: '2', position: 2, label: 'Search', note: 'filters' },
    ];
    expect(coreItemDraftsFromDto(items)).toEqual([
      { key: '1', label: 'Home', note: '' },
      { key: '2', label: 'Search', note: 'filters' },
    ]);
  });
});

describe('addCoreItemDraft', () => {
  it('appends a trimmed label', () => {
    expect(addCoreItemDraft(CATALOG, { key: 'c', label: '  Checkout  ', note: 'card' })).toEqual([
      ...CATALOG,
      { key: 'c', label: 'Checkout', note: 'card' },
    ]);
  });

  it('refuses a blank label', () => {
    expect(addCoreItemDraft(CATALOG, { key: 'c', label: '   ', note: 'x' })).toBeNull();
    expect(addCoreItemDraft(CATALOG, { key: 'c', label: '', note: '' })).toBeNull();
  });
});

describe('replaceCoreItemDraft and removeCoreItemDraft', () => {
  it('edits one row without touching the others', () => {
    expect(replaceCoreItemDraft(CATALOG, 'b', { label: 'Search', note: 'facets' })).toEqual([
      CATALOG[0],
      { key: 'b', label: 'Search', note: 'facets' },
    ]);
  });

  it('removes by key', () => {
    expect(removeCoreItemDraft(CATALOG, 'a')).toEqual([CATALOG[1]]);
  });
});

describe('moveCoreItemDraft', () => {
  it('reorders up and down and ignores the ends', () => {
    expect(moveCoreItemDraft(CATALOG, 'b', 'up').map((row) => row.key)).toEqual(['b', 'a']);
    expect(moveCoreItemDraft(CATALOG, 'a', 'down').map((row) => row.key)).toEqual(['b', 'a']);
    expect(moveCoreItemDraft(CATALOG, 'a', 'up')).toEqual(CATALOG);
    expect(moveCoreItemDraft(CATALOG, 'b', 'down')).toEqual(CATALOG);
  });
});

describe('toCoreItemInputs', () => {
  it('sends notes as null when empty and never includes a position', () => {
    const result = toCoreItemInputs(CATALOG);
    expect(result.error).toBeNull();
    if (result.error !== null) {
      return;
    }
    expect(result.items).toEqual([
      { label: 'Home', note: 'hero' },
      { label: 'Catalog', note: null },
    ]);
    expect(result.items.every((item) => !('position' in item))).toBe(true);
  });

  it('refuses a blank label on save', () => {
    expect(toCoreItemInputs([{ key: 'a', label: '  ', note: 'x' }])).toEqual({
      error: 'blankLabel',
    });
  });
});
