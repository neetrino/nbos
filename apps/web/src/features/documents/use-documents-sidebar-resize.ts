'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clampDocumentsSidebarWidth,
  persistDocumentsSidebarWidth,
  readStoredDocumentsSidebarWidth,
} from './documents-sidebar-width';
import {
  DOCS_SIDEBAR_RESIZE_MEDIA_QUERY,
  DOCS_SIDEBAR_RESIZE_NUDGE_PX,
  DOCS_SIDEBAR_WIDTH_DEFAULT_PX,
} from './documents-sidebar-resize-constants';

export type UseDocumentsSidebarResizeResult = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  sidebarWidthPx: number;
  isDragging: boolean;
  isResizeEnabled: boolean;
  handlePointerDown: React.PointerEventHandler<HTMLDivElement>;
  handleKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
};

export function useDocumentsSidebarResize(): UseDocumentsSidebarResizeResult {
  const containerRef = useRef<HTMLDivElement>(null);
  // Initialize with the SSR-safe default so server and client first-render agree.
  // Sync the stored value from localStorage after mount (client only).
  const [sidebarWidthPx, setSidebarWidthPx] = useState(DOCS_SIDEBAR_WIDTH_DEFAULT_PX);
  const [isDragging, setIsDragging] = useState(false);
  // Start false (SSR-safe); sync the real value after mount to avoid hydration mismatch.
  const [isResizeEnabled, setIsResizeEnabled] = useState(false);

  useEffect(() => {
    // localStorage is client-only; reading after mount is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarWidthPx(readStoredDocumentsSidebarWidth());
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(DOCS_SIDEBAR_RESIZE_MEDIA_QUERY);
    // Call via the listener wrapper so setState is not invoked directly in the effect body.
    const sync = () => setIsResizeEnabled(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Reclamp if the container resizes and current width exceeds remaining space.
  const reclampToContainer = useCallback(() => {
    const containerWidth = containerRef.current?.getBoundingClientRect().width ?? 0;
    if (containerWidth <= 0) return;
    setSidebarWidthPx((prev) => {
      const next = clampDocumentsSidebarWidth(prev);
      if (next !== prev) persistDocumentsSidebarWidth(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(reclampToContainer);
    observer.observe(node);
    return () => observer.disconnect();
  }, [reclampToContainer]);

  const updateWidthFromPointer = useCallback((clientX: number) => {
    const containerLeft = containerRef.current?.getBoundingClientRect().left ?? 0;
    const raw = clientX - containerLeft;
    const next = clampDocumentsSidebarWidth(raw);
    setSidebarWidthPx(next);
    persistDocumentsSidebarWidth(next);
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || !isResizeEnabled) return;
      event.preventDefault();
      event.stopPropagation();

      const pointerId = event.pointerId;
      const target = event.currentTarget;
      target.setPointerCapture(pointerId);
      setIsDragging(true);
      updateWidthFromPointer(event.clientX);

      const onMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) return;
        moveEvent.preventDefault();
        updateWidthFromPointer(moveEvent.clientX);
      };

      const onEnd = (endEvent: PointerEvent) => {
        if (endEvent.pointerId !== pointerId) return;
        if (target.hasPointerCapture(pointerId)) {
          target.releasePointerCapture(pointerId);
        }
        setIsDragging(false);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
        window.removeEventListener('pointercancel', onEnd);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onEnd);
      window.addEventListener('pointercancel', onEnd);
    },
    [isResizeEnabled, updateWidthFromPointer],
  );

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const delta =
      event.key === 'ArrowLeft' ? -DOCS_SIDEBAR_RESIZE_NUDGE_PX : DOCS_SIDEBAR_RESIZE_NUDGE_PX;
    setSidebarWidthPx((prev) => {
      const next = clampDocumentsSidebarWidth(prev + delta);
      persistDocumentsSidebarWidth(next);
      return next;
    });
  }, []);

  // Body cursor + text-selection guard while dragging.
  useEffect(() => {
    if (!isDragging) return;
    const prevCursor = document.body.style.cursor;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevUserSelect;
    };
  }, [isDragging]);

  return {
    containerRef,
    sidebarWidthPx,
    isDragging,
    isResizeEnabled,
    handlePointerDown,
    handleKeyDown,
  };
}
