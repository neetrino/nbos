export const BOTTOM_SHEET_SWIPE_Y_VAR = '--nbos-sheet-swipe-y';
export const BOTTOM_SHEET_SWIPE_OVERLAY_VAR = '--nbos-sheet-swipe-overlay';
export const BOTTOM_SHEET_SWIPE_PANEL_CLASS = 'nbos-sheet-swipe';
export const BOTTOM_SHEET_SWIPE_OVERLAY_CLASS = 'nbos-sheet-swipe-overlay';
export const BOTTOM_SHEET_SWIPE_HANDLE_ATTR = 'data-nbos-sheet-swipe-handle';
export const BOTTOM_SHEET_SWIPE_SCROLL_ATTR = 'data-nbos-sheet-swipe-scroll';

export const BOTTOM_SHEET_SWIPE_ACTIVATE_DISTANCE_PX = 8;
/** Match Vaul / iOS sheet: dismiss after a quarter of the panel. */
export const BOTTOM_SHEET_SWIPE_CLOSE_RATIO = 0.25;
export const BOTTOM_SHEET_SWIPE_FLICK_DISTANCE_PX = 24;
export const BOTTOM_SHEET_SWIPE_CLOSE_VELOCITY_PX_PER_MS = 0.5;
/** Keep in sync with Kamancha `bottom-sheet-panel-out` (300ms). */
export const BOTTOM_SHEET_SWIPE_SNAP_MS = 300;
export const BOTTOM_SHEET_SWIPE_TOP_SETTLE_MS = 100;
export const BOTTOM_SHEET_SWIPE_UPWARD_RESISTANCE = 0.14;

const INTERACTIVE_SWIPE_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

export function clampSwipeOffset(deltaY: number): number {
  if (deltaY >= 0) return deltaY;
  return deltaY * BOTTOM_SHEET_SWIPE_UPWARD_RESISTANCE;
}

export function computeSwipeVelocity(
  lastY: number,
  lastTime: number,
  clientY: number,
  timeStamp: number,
): number {
  const elapsedMs = Math.max(1, timeStamp - lastTime);
  return (clientY - lastY) / elapsedMs;
}

export function overlayOpacityForSwipe(offsetY: number, height: number): number {
  if (offsetY <= 0 || height <= 0) return 1;
  return Math.max(0, 1 - offsetY / height);
}

export function canBeginBottomSheetSwipe(input: {
  deltaY: number;
  fromHandle: boolean;
  scrollAtTop: boolean;
}): boolean {
  const distance = input.fromHandle ? Math.abs(input.deltaY) : input.deltaY;
  if (distance < BOTTOM_SHEET_SWIPE_ACTIVATE_DISTANCE_PX) return false;
  return input.fromHandle || input.scrollAtTop;
}

export function shouldDismissBottomSheet(
  offsetY: number,
  velocityY: number,
  height: number,
): boolean {
  if (height > 0 && offsetY / height >= BOTTOM_SHEET_SWIPE_CLOSE_RATIO) return true;
  return (
    offsetY >= BOTTOM_SHEET_SWIPE_FLICK_DISTANCE_PX &&
    velocityY >= BOTTOM_SHEET_SWIPE_CLOSE_VELOCITY_PX_PER_MS
  );
}

export function isInteractiveSwipeTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(INTERACTIVE_SWIPE_SELECTOR));
}
