'use client';

import { useLayoutEffect, type RefObject } from 'react';
import {
  KANBAN_TOUCH_AXIS_LOCK_PX,
  nextKanbanBoardScrollLeft,
  resolveKanbanTouchAxis,
  type KanbanTouchAxis,
} from './kanban-touch-axis';

const IDLE_TOUCH_ID = -1;

type KanbanTouchGesture = {
  axis: KanbanTouchAxis;
  id: number;
  startX: number;
  startY: number;
  startScroll: number;
};

/**
 * Nested column `overflow-y` panes swallow horizontal pans on iOS.
 * Non-passive touchmove + preventDefault is required; pointer events do not stop native scroll.
 */
export function useKanbanHorizontalTouchBridge(
  scrollRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  layoutKey?: number | string,
): void {
  useLayoutEffect(() => {
    if (!enabled) return;
    const el = scrollRef.current;
    if (!el) return;
    return attachKanbanHorizontalTouchBridge(el);
  }, [enabled, layoutKey, scrollRef]);
}

function attachKanbanHorizontalTouchBridge(el: HTMLDivElement): () => void {
  const gesture: KanbanTouchGesture = {
    axis: 'undecided',
    id: IDLE_TOUCH_ID,
    startX: 0,
    startY: 0,
    startScroll: 0,
  };

  const reset = () => {
    gesture.axis = 'undecided';
    gesture.id = IDLE_TOUCH_ID;
  };

  const onStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    if (!touch) return;
    gesture.id = touch.identifier;
    gesture.axis = 'undecided';
    gesture.startX = touch.clientX;
    gesture.startY = touch.clientY;
    gesture.startScroll = el.scrollLeft;
  };

  const onMove = (event: TouchEvent) => applyKanbanBoardTouchMove(el, event, gesture);
  const listenerOpts: AddEventListenerOptions = { capture: true, passive: false };

  el.addEventListener('touchstart', onStart, { capture: true, passive: true });
  el.addEventListener('touchmove', onMove, listenerOpts);
  el.addEventListener('touchend', reset, true);
  el.addEventListener('touchcancel', reset, true);
  return () => {
    el.removeEventListener('touchstart', onStart, true);
    el.removeEventListener('touchmove', onMove, true);
    el.removeEventListener('touchend', reset, true);
    el.removeEventListener('touchcancel', reset, true);
    reset();
  };
}

function applyKanbanBoardTouchMove(
  el: HTMLDivElement,
  event: TouchEvent,
  gesture: KanbanTouchGesture,
): void {
  if (gesture.id === IDLE_TOUCH_ID) return;
  const touch = findActiveTouch(event.touches, gesture.id);
  if (!touch) return;
  const dx = touch.clientX - gesture.startX;
  const dy = touch.clientY - gesture.startY;
  if (gesture.axis === 'undecided') {
    gesture.axis = resolveKanbanTouchAxis(dx, dy, KANBAN_TOUCH_AXIS_LOCK_PX);
  }
  if (gesture.axis !== 'x') return;
  const maxScroll = el.scrollWidth - el.clientWidth;
  el.scrollLeft = nextKanbanBoardScrollLeft(gesture.startScroll, dx, maxScroll);
  event.preventDefault();
}

function findActiveTouch(touches: TouchList, id: number): Touch | undefined {
  for (let i = 0; i < touches.length; i += 1) {
    const touch = touches.item(i);
    if (touch?.identifier === id) return touch;
  }
  return undefined;
}
