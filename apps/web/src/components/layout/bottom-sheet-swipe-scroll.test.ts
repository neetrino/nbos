/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest';
import {
  findBottomSheetLayerClose,
  isBottomSheetLayerTarget,
  isBottomSheetScrollAtTop,
  resolveBottomSheetScrollRegion,
} from './bottom-sheet-swipe';
import {
  BOTTOM_SHEET_LAYER_ATTR,
  BOTTOM_SHEET_LAYER_CLOSE_ATTR,
  BOTTOM_SHEET_SWIPE_SCROLL_ATTR,
} from './bottom-sheet-swipe-motion';

describe('resolveBottomSheetScrollRegion', () => {
  it('uses the innermost scroller under the pointer, not the sheet body', () => {
    const panel = document.createElement('div');
    const body = document.createElement('div');
    body.setAttribute(BOTTOM_SHEET_SWIPE_SCROLL_ATTR, '');
    const list = document.createElement('div');
    list.setAttribute(BOTTOM_SHEET_SWIPE_SCROLL_ATTR, '');
    const row = document.createElement('button');
    list.append(row);
    body.append(list);
    panel.append(body);
    document.body.append(panel);

    expect(resolveBottomSheetScrollRegion(panel, row)).toBe(list);
    expect(isBottomSheetScrollAtTop(panel, row)).toBe(true);
    list.scrollTop = 40;
    expect(isBottomSheetScrollAtTop(panel, row)).toBe(false);

    panel.remove();
  });
});

describe('bottom sheet layer swipe', () => {
  it('finds the layer close control from a row inside the layer', () => {
    const layer = document.createElement('div');
    layer.setAttribute(BOTTOM_SHEET_LAYER_ATTR, '');
    const close = document.createElement('button');
    close.setAttribute(BOTTOM_SHEET_LAYER_CLOSE_ATTR, '');
    const row = document.createElement('button');
    layer.append(close, row);
    document.body.append(layer);

    expect(isBottomSheetLayerTarget(row)).toBe(true);
    expect(findBottomSheetLayerClose(row)).toBe(close);

    layer.remove();
  });
});
