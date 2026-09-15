import { describe, expect, it } from 'vitest';
import { isNestedItemSheetActive, resolveEntitySheetStack } from './resolve-entity-sheet-stack';

describe('resolveEntitySheetStack', () => {
  it('keeps a first nested sheet on the nested overlay layer', () => {
    expect(
      resolveEntitySheetStack({
        forceNestedBackdrop: true,
        stackAboveEntitySheet: false,
        stackAboveNestedItem: false,
      }),
    ).toEqual({ forceNestedBackdrop: true, stackAboveEntitySheet: false });
  });

  it('raises a relation sheet above an already-open nested item sheet', () => {
    expect(
      resolveEntitySheetStack({
        forceNestedBackdrop: true,
        stackAboveEntitySheet: false,
        stackAboveNestedItem: true,
      }),
    ).toEqual({ forceNestedBackdrop: false, stackAboveEntitySheet: true });
  });

  it('preserves an explicit above-entity stack', () => {
    expect(
      resolveEntitySheetStack({
        forceNestedBackdrop: false,
        stackAboveEntitySheet: true,
        stackAboveNestedItem: false,
      }),
    ).toEqual({ forceNestedBackdrop: false, stackAboveEntitySheet: true });
  });
});

describe('isNestedItemSheetActive', () => {
  it('is true only when the host is nested and a child sheet is open', () => {
    expect(isNestedItemSheetActive(true, [false, true])).toBe(true);
    expect(isNestedItemSheetActive(true, [false, false])).toBe(false);
    expect(isNestedItemSheetActive(false, [true])).toBe(false);
  });
});
