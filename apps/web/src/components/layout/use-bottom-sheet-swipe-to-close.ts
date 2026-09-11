'use client';

import { useCallback, useLayoutEffect, useRef, type RefCallback } from 'react';
import { attachBottomSheetSwipe } from './bottom-sheet-swipe';

const SHEET_CONTENT_SLOT = '[data-slot="sheet-content"], [data-slot="dialog-content"]';

export function useBottomSheetSwipeToClose(
  open: boolean,
  onClose: () => void,
): RefCallback<HTMLDivElement> {
  const onCloseRef = useRef(onClose);
  const cleanupRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  return useCallback(
    (node) => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      if (!open || !node) return;
      const panel = node.closest(SHEET_CONTENT_SLOT);
      if (!(panel instanceof HTMLElement)) return;
      cleanupRef.current = attachBottomSheetSwipe(panel, () => onCloseRef.current());
    },
    [open],
  );
}
