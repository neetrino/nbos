import {
  BOTTOM_SHEET_SWIPE_ACTIVATE_DISTANCE_PX,
  BOTTOM_SHEET_SWIPE_FLICK_DISTANCE_PX,
  BOTTOM_SHEET_SWIPE_HANDLE_ATTR,
  BOTTOM_SHEET_SWIPE_OVERLAY_CLASS,
  BOTTOM_SHEET_SWIPE_OVERLAY_VAR,
  BOTTOM_SHEET_SWIPE_SCROLL_ATTR,
  BOTTOM_SHEET_SWIPE_SNAP_MS,
  BOTTOM_SHEET_SWIPE_TOP_SETTLE_MS,
  BOTTOM_SHEET_SWIPE_Y_VAR,
  canBeginBottomSheetSwipe,
  clampSwipeOffset,
  computeSwipeVelocity,
  isInteractiveSwipeTarget,
  overlayOpacityForSwipe,
  shouldDismissBottomSheet,
} from './bottom-sheet-swipe-motion';

export {
  BOTTOM_SHEET_SWIPE_PANEL_CLASS,
  BOTTOM_SHEET_SWIPE_HANDLE_ATTR,
  BOTTOM_SHEET_SWIPE_SCROLL_ATTR,
} from './bottom-sheet-swipe-motion';

const SHEET_OVERLAY_SLOT = '[data-slot="sheet-overlay"], [data-slot="dialog-overlay"]';

type SwipeSession = {
  pointerId: number | null;
  startY: number;
  lastY: number;
  lastTime: number;
  dragging: boolean;
  tracking: boolean;
  fromChrome: boolean;
  lastScrollAwayAt: number;
  dismissTimer: number | null;
  overlay: HTMLElement | null;
};

export function isBottomSheetChromeTarget(panel: HTMLElement, target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const scroll = panel.querySelector(`[${BOTTOM_SHEET_SWIPE_SCROLL_ATTR}]`);
  if (!(scroll instanceof HTMLElement)) {
    return Boolean(target.closest(`[${BOTTOM_SHEET_SWIPE_HANDLE_ATTR}]`));
  }
  return !scroll.contains(target);
}

export function isBottomSheetScrollAtTop(panel: HTMLElement): boolean {
  const scroll = panel.querySelector(`[${BOTTOM_SHEET_SWIPE_SCROLL_ATTR}]`);
  if (!(scroll instanceof HTMLElement)) return true;
  return scroll.scrollTop <= 0;
}

export function resetBottomSheetSwipeStyles(
  panel: HTMLElement,
  overlay: HTMLElement | null = findSheetOverlay(panel),
): void {
  panel.removeAttribute('data-swiping');
  panel.removeAttribute('data-swipe-snap');
  panel.style.removeProperty(BOTTOM_SHEET_SWIPE_Y_VAR);
  if (!overlay) return;
  overlay.removeAttribute('data-swiping');
  overlay.removeAttribute('data-swipe-snap');
  overlay.style.removeProperty(BOTTOM_SHEET_SWIPE_OVERLAY_VAR);
  overlay.classList.remove(BOTTOM_SHEET_SWIPE_OVERLAY_CLASS);
}

export function setBottomSheetSwipeVisuals(
  panel: HTMLElement,
  overlay: HTMLElement | null,
  offsetY: number,
): void {
  panel.style.setProperty(BOTTOM_SHEET_SWIPE_Y_VAR, `${offsetY}px`);
  if (!overlay) return;
  const height = Math.max(panel.getBoundingClientRect().height, 1);
  overlay.style.setProperty(
    BOTTOM_SHEET_SWIPE_OVERLAY_VAR,
    String(overlayOpacityForSwipe(offsetY, height)),
  );
}

export function attachBottomSheetSwipe(panel: HTMLElement, onClose: () => void): () => void {
  const session = createSwipeSession(panel);
  const onPointerDown = (event: PointerEvent) => handleSwipePointerDown(session, panel, event);
  const onPointerMove = (event: PointerEvent) => handleSwipePointerMove(session, panel, event);
  const onPointerUp = (event: PointerEvent) => handleSwipePointerUp(session, panel, event, onClose);
  const detachScroll = attachScrollSettleTracking(panel, session);

  const onTouchMove = (event: TouchEvent) => {
    if (!session.dragging) return;
    event.preventDefault();
  };

  panel.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove, { capture: true, passive: false });
  document.addEventListener('pointerup', onPointerUp, { capture: true });
  document.addEventListener('pointercancel', onPointerUp, { capture: true });
  document.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });

  return () => {
    if (session.dismissTimer !== null) window.clearTimeout(session.dismissTimer);
    detachScroll();
    panel.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointermove', onPointerMove, { capture: true });
    document.removeEventListener('pointerup', onPointerUp, { capture: true });
    document.removeEventListener('pointercancel', onPointerUp, { capture: true });
    document.removeEventListener('touchmove', onTouchMove, { capture: true });
  };
}

function createSwipeSession(panel: HTMLElement): SwipeSession {
  const overlay = findSheetOverlay(panel);
  overlay?.classList.add(BOTTOM_SHEET_SWIPE_OVERLAY_CLASS);
  return {
    pointerId: null,
    startY: 0,
    lastY: 0,
    lastTime: 0,
    dragging: false,
    tracking: false,
    fromChrome: false,
    lastScrollAwayAt: 0,
    dismissTimer: null,
    overlay,
  };
}

function findSheetOverlay(panel: HTMLElement): HTMLElement | null {
  const parent = panel.parentElement;
  if (parent) {
    const nested = parent.querySelector(`:scope > ${SHEET_OVERLAY_SLOT}`);
    if (nested instanceof HTMLElement) return nested;
  }
  let sibling = panel.previousElementSibling;
  while (sibling) {
    if (sibling instanceof HTMLElement && sibling.matches(SHEET_OVERLAY_SLOT)) return sibling;
    sibling = sibling.previousElementSibling;
  }
  return null;
}

function attachScrollSettleTracking(panel: HTMLElement, session: SwipeSession): () => void {
  const scroll = panel.querySelector(`[${BOTTOM_SHEET_SWIPE_SCROLL_ATTR}]`);
  if (!(scroll instanceof HTMLElement)) return () => undefined;
  const onScroll = () => {
    if (scroll.scrollTop > 0) session.lastScrollAwayAt = performance.now();
  };
  scroll.addEventListener('scroll', onScroll, { passive: true });
  return () => scroll.removeEventListener('scroll', onScroll);
}

function isScrollReadyForSwipe(panel: HTMLElement, session: SwipeSession): boolean {
  if (!isBottomSheetScrollAtTop(panel)) return false;
  const scroll = panel.querySelector(`[${BOTTOM_SHEET_SWIPE_SCROLL_ATTR}]`);
  if (!(scroll instanceof HTMLElement)) return true;
  return performance.now() - session.lastScrollAwayAt >= BOTTOM_SHEET_SWIPE_TOP_SETTLE_MS;
}

function handleSwipePointerDown(
  session: SwipeSession,
  panel: HTMLElement,
  event: PointerEvent,
): void {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  if (session.dismissTimer !== null) return;
  if (isInteractiveSwipeTarget(event.target)) return;
  session.pointerId = event.pointerId;
  session.startY = event.clientY;
  session.lastY = event.clientY;
  session.lastTime = event.timeStamp;
  session.dragging = false;
  session.tracking = true;
  session.fromChrome = isBottomSheetChromeTarget(panel, event.target);
}

function handleSwipePointerMove(
  session: SwipeSession,
  panel: HTMLElement,
  event: PointerEvent,
): void {
  if (!session.tracking || event.pointerId !== session.pointerId) return;
  const deltaY = event.clientY - session.startY;
  if (!session.dragging && !tryBeginSwipe(session, panel, event, deltaY)) return;
  event.preventDefault();
  session.lastY = event.clientY;
  session.lastTime = event.timeStamp;
  setBottomSheetSwipeVisuals(panel, session.overlay, clampSwipeOffset(deltaY));
}

function tryBeginSwipe(
  session: SwipeSession,
  panel: HTMLElement,
  event: PointerEvent,
  deltaY: number,
): boolean {
  const fromHandle = session.fromChrome;
  if (deltaY <= -BOTTOM_SHEET_SWIPE_ACTIVATE_DISTANCE_PX && !fromHandle) {
    session.tracking = false;
    return false;
  }
  const scrollAtTop = isScrollReadyForSwipe(panel, session);
  if (!canBeginBottomSheetSwipe({ deltaY, fromHandle, scrollAtTop })) {
    if (deltaY >= BOTTOM_SHEET_SWIPE_ACTIVATE_DISTANCE_PX && !fromHandle) {
      session.tracking = false;
    }
    return false;
  }
  session.dragging = true;
  markSwipeState(panel, session.overlay, 'swiping');
  return true;
}

function handleSwipePointerUp(
  session: SwipeSession,
  panel: HTMLElement,
  event: PointerEvent,
  onClose: () => void,
): void {
  if (!session.tracking || event.pointerId !== session.pointerId) return;
  const wasDragging = session.dragging;
  const offsetY = clampSwipeOffset(event.clientY - session.startY);
  const velocityY = computeSwipeVelocity(
    session.lastY,
    session.lastTime,
    event.clientY,
    event.timeStamp,
  );
  session.tracking = false;
  session.dragging = false;
  session.pointerId = null;
  if (!wasDragging) return;
  suppressNextClick(panel);
  const height = panel.getBoundingClientRect().height;
  if (shouldDismissBottomSheet(offsetY, velocityY, height)) {
    dismissBottomSheet(session, panel, onClose);
    return;
  }
  snapBottomSheetClosed(panel, session.overlay);
}

function dismissBottomSheet(session: SwipeSession, panel: HTMLElement, onClose: () => void): void {
  const height = Math.max(
    panel.getBoundingClientRect().height,
    BOTTOM_SHEET_SWIPE_FLICK_DISTANCE_PX,
  );
  markSwipeState(panel, session.overlay, 'snap');
  setBottomSheetSwipeVisuals(panel, session.overlay, height);
  session.dismissTimer = window.setTimeout(() => {
    session.dismissTimer = null;
    onClose();
  }, BOTTOM_SHEET_SWIPE_SNAP_MS);
}

function snapBottomSheetClosed(panel: HTMLElement, overlay: HTMLElement | null): void {
  markSwipeState(panel, overlay, 'snap');
  setBottomSheetSwipeVisuals(panel, overlay, 0);
  window.setTimeout(() => {
    if (panel.getAttribute('data-swiping') === 'true') return;
    resetBottomSheetSwipeStyles(panel, overlay);
  }, BOTTOM_SHEET_SWIPE_SNAP_MS);
}

function markSwipeState(
  panel: HTMLElement,
  overlay: HTMLElement | null,
  state: 'swiping' | 'snap',
): void {
  const active = state === 'swiping' ? 'data-swiping' : 'data-swipe-snap';
  const idle = state === 'swiping' ? 'data-swipe-snap' : 'data-swiping';
  panel.setAttribute(active, 'true');
  panel.removeAttribute(idle);
  overlay?.setAttribute(active, 'true');
  overlay?.removeAttribute(idle);
}

function suppressNextClick(panel: HTMLElement): void {
  const blockClick = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  panel.addEventListener('click', blockClick, { capture: true, once: true });
}
