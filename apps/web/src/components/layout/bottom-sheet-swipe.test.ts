import { describe, expect, it } from 'vitest';
import {
  BOTTOM_SHEET_SWIPE_ACTIVATE_DISTANCE_PX,
  BOTTOM_SHEET_SWIPE_CLOSE_RATIO,
  BOTTOM_SHEET_SWIPE_CLOSE_VELOCITY_PX_PER_MS,
  BOTTOM_SHEET_SWIPE_FLICK_DISTANCE_PX,
  BOTTOM_SHEET_SWIPE_UPWARD_RESISTANCE,
  canBeginBottomSheetSwipe,
  clampSwipeOffset,
  computeSwipeVelocity,
  overlayOpacityForSwipe,
  shouldDismissBottomSheet,
} from './bottom-sheet-swipe-motion';

describe('clampSwipeOffset', () => {
  it('rubber-bands upward movement', () => {
    expect(clampSwipeOffset(-40)).toBeCloseTo(-40 * BOTTOM_SHEET_SWIPE_UPWARD_RESISTANCE);
  });

  it('keeps downward movement', () => {
    expect(clampSwipeOffset(64)).toBe(64);
  });
});

describe('canBeginBottomSheetSwipe', () => {
  it('starts from the handle once the finger has moved enough', () => {
    expect(
      canBeginBottomSheetSwipe({
        deltaY: BOTTOM_SHEET_SWIPE_ACTIVATE_DISTANCE_PX,
        fromHandle: true,
        scrollAtTop: false,
      }),
    ).toBe(true);
  });

  it('starts from the handle on a short upward tug', () => {
    expect(
      canBeginBottomSheetSwipe({
        deltaY: -BOTTOM_SHEET_SWIPE_ACTIVATE_DISTANCE_PX,
        fromHandle: true,
        scrollAtTop: false,
      }),
    ).toBe(true);
  });

  it('starts from the body only when the sheet is scrolled to the top', () => {
    expect(
      canBeginBottomSheetSwipe({
        deltaY: BOTTOM_SHEET_SWIPE_ACTIVATE_DISTANCE_PX,
        fromHandle: false,
        scrollAtTop: true,
      }),
    ).toBe(true);
    expect(
      canBeginBottomSheetSwipe({
        deltaY: BOTTOM_SHEET_SWIPE_ACTIVATE_DISTANCE_PX,
        fromHandle: false,
        scrollAtTop: false,
      }),
    ).toBe(false);
  });
});

describe('shouldDismissBottomSheet', () => {
  const sheetHeightPx = 400;

  it('closes after dragging a quarter of the sheet', () => {
    expect(
      shouldDismissBottomSheet(sheetHeightPx * BOTTOM_SHEET_SWIPE_CLOSE_RATIO, 0, sheetHeightPx),
    ).toBe(true);
  });

  it('closes on a short flick', () => {
    expect(
      shouldDismissBottomSheet(
        BOTTOM_SHEET_SWIPE_FLICK_DISTANCE_PX,
        BOTTOM_SHEET_SWIPE_CLOSE_VELOCITY_PX_PER_MS,
        sheetHeightPx,
      ),
    ).toBe(true);
  });

  it('does not close on a small slow drag', () => {
    expect(shouldDismissBottomSheet(16, 0.1, sheetHeightPx)).toBe(false);
  });
});

describe('overlayOpacityForSwipe', () => {
  it('stays opaque until the sheet moves down', () => {
    expect(overlayOpacityForSwipe(0, 400)).toBe(1);
    expect(overlayOpacityForSwipe(-12, 400)).toBe(1);
  });

  it('fades the overlay as the sheet is dragged away', () => {
    expect(overlayOpacityForSwipe(200, 400)).toBe(0.5);
    expect(overlayOpacityForSwipe(400, 400)).toBe(0);
  });
});

describe('computeSwipeVelocity', () => {
  it('uses at least one millisecond so a tap is not infinite', () => {
    expect(computeSwipeVelocity(10, 100, 10, 100)).toBe(0);
  });
});
