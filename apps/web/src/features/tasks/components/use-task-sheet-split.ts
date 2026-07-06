'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clampTaskSheetDetailRatio,
  persistTaskSheetDetailRatio,
  readStoredTaskSheetDetailRatio,
} from './task-sheet-split-ratio';

import { TASK_SHEET_SPLIT_ROW_MIN_VIEWPORT_PX } from './task-sheet-split-constants';

const TASK_SHEET_SPLIT_ROW_MEDIA = `(min-width: ${TASK_SHEET_SPLIT_ROW_MIN_VIEWPORT_PX}px)`;

function readSplitRowMedia(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(TASK_SHEET_SPLIT_ROW_MEDIA).matches;
}

interface UseTaskSheetSplitResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  detailRatio: number;
  detailRatioPercent: number;
  isDragging: boolean;
  isSplitRow: boolean;
  handlePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  nudgeDetailRatio: (delta: number) => void;
}

export function useTaskSheetSplit(): UseTaskSheetSplitResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [detailRatio, setDetailRatio] = useState(() => readStoredTaskSheetDetailRatio());
  const [isDragging, setIsDragging] = useState(false);
  const [isSplitRow, setIsSplitRow] = useState(readSplitRowMedia);

  useEffect(() => {
    const mq = window.matchMedia(TASK_SHEET_SPLIT_ROW_MEDIA);
    const sync = () => setIsSplitRow(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const reclampToContainer = useCallback(() => {
    const width = containerRef.current?.getBoundingClientRect().width ?? 0;
    if (width <= 0) return;
    setDetailRatio((prev) => {
      const next = clampTaskSheetDetailRatio(prev, width);
      if (next !== prev) persistTaskSheetDetailRatio(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => reclampToContainer());
    observer.observe(node);
    return () => observer.disconnect();
  }, [reclampToContainer]);

  const updateRatioFromPointer = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;

    const raw = (clientX - rect.left) / rect.width;
    const next = clampTaskSheetDetailRatio(raw, rect.width);
    setDetailRatio(next);
    persistTaskSheetDetailRatio(next);
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || !isSplitRow) return;
      event.preventDefault();
      event.stopPropagation();

      const pointerId = event.pointerId;
      const target = event.currentTarget;
      target.setPointerCapture(pointerId);
      setIsDragging(true);
      updateRatioFromPointer(event.clientX);

      const onMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) return;
        moveEvent.preventDefault();
        updateRatioFromPointer(moveEvent.clientX);
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
    [isSplitRow, updateRatioFromPointer],
  );

  useEffect(() => {
    if (!isDragging) return;
    const prev = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    return () => {
      document.body.style.userSelect = prev;
      document.body.style.cursor = prevCursor;
    };
  }, [isDragging]);

  const nudgeDetailRatio = useCallback((delta: number) => {
    const width = containerRef.current?.getBoundingClientRect().width ?? 0;
    setDetailRatio((prev) => {
      const next = clampTaskSheetDetailRatio(prev + delta, width);
      persistTaskSheetDetailRatio(next);
      return next;
    });
  }, []);

  const detailRatioPercent = Math.round(detailRatio * 1000) / 10;

  return {
    containerRef,
    detailRatio,
    detailRatioPercent,
    isDragging,
    isSplitRow,
    handlePointerDown,
    nudgeDetailRatio,
  };
}
