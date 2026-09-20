import { describe, expect, it } from 'vitest';
import { CatalogContentValidationError } from './catalog-write';
import { parseCoreItemsBody } from './core-items-write';

describe('parseCoreItemsBody', () => {
  it('reads a list of labelled core items and trims them', () => {
    expect(
      parseCoreItemsBody({
        items: [
          { label: '  Каталог и страница товара ', note: '  до трёх уровней категорий ' },
          { label: 'Checkout', note: null },
        ],
      }),
    ).toEqual([
      { label: 'Каталог и страница товара', note: 'до трёх уровней категорий' },
      { label: 'Checkout', note: null },
    ]);
  });

  it('accepts a bare array as well as a wrapped body', () => {
    expect(parseCoreItemsBody([{ label: 'Главная' }])).toEqual([{ label: 'Главная', note: null }]);
  });

  it('treats an empty note as no note', () => {
    expect(parseCoreItemsBody([{ label: 'Поиск', note: '' }])).toEqual([
      { label: 'Поиск', note: null },
    ]);
  });

  it('rejects a missing label', () => {
    expect(() => parseCoreItemsBody([{ note: 'no label' }])).toThrow(CatalogContentValidationError);
  });

  it('rejects the same item listed twice, whatever the case', () => {
    expect(() => parseCoreItemsBody([{ label: 'Checkout' }, { label: 'checkout' }])).toThrow(
      /listed twice/,
    );
  });

  it('refuses a list long enough to mean the core was decomposed into modules', () => {
    const items = Array.from({ length: 41 }, (_, index) => ({ label: `Item ${index}` }));
    expect(() => parseCoreItemsBody(items)).toThrow(/more than 40/);
  });

  it('rejects anything that is not a list', () => {
    expect(() => parseCoreItemsBody({ items: 'Главная' })).toThrow(CatalogContentValidationError);
  });

  it('never accepts units on a core item, since the core is priced by the profile', () => {
    const parsed = parseCoreItemsBody([{ label: 'Главная', units: 20, roleUnits: [] }]);
    expect(Object.keys(parsed[0] ?? {})).toEqual(['label', 'note']);
  });
});
