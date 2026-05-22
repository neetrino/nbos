'use client';

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TASK_SHEET_CHAT_COLUMN_CLASS, TASK_SHEET_DETAIL_COLUMN_CLASS } from './task-sheet-classes';
import {
  TASK_SHEET_CHAT_MIN_PX,
  TASK_SHEET_DETAIL_MIN_PX,
  TASK_SHEET_SPLIT_HIT_PX,
} from './task-sheet-split-constants';
import { useTaskSheetSplit } from './use-task-sheet-split';

interface TaskSheetSplitLayoutProps {
  detail: ReactNode;
  chat: ReactNode;
}

function detailColumnStyle(isSplitRow: boolean, detailRatioPercent: number): CSSProperties {
  if (!isSplitRow) {
    return { minWidth: `min(100%, ${TASK_SHEET_DETAIL_MIN_PX}px)` };
  }

  return {
    flex: '0 0 auto',
    width: `${detailRatioPercent}%`,
    maxWidth: `${detailRatioPercent}%`,
    minWidth: 0,
  };
}

function chatColumnStyle(isSplitRow: boolean): CSSProperties {
  if (!isSplitRow) {
    return { minWidth: `min(100%, ${TASK_SHEET_CHAT_MIN_PX}px)` };
  }

  return {
    flex: '1 1 0',
    minWidth: TASK_SHEET_CHAT_MIN_PX,
    overflow: 'hidden',
  };
}

export function TaskSheetSplitLayout({ detail, chat }: TaskSheetSplitLayoutProps) {
  const split = useTaskSheetSplit();

  return (
    <div
      ref={split.containerRef}
      className={cn(
        'flex min-h-0 min-w-0 flex-1 overflow-hidden',
        split.isSplitRow ? 'flex-row' : 'flex-col',
        split.isDragging && 'select-none',
      )}
    >
      <div
        className={cn(
          TASK_SHEET_DETAIL_COLUMN_CLASS,
          'min-h-0 min-w-0',
          split.isSplitRow ? 'overflow-hidden' : 'w-full',
        )}
        style={detailColumnStyle(split.isSplitRow, split.detailRatioPercent)}
      >
        {detail}
      </div>

      {split.isSplitRow ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuemin={30}
          aria-valuemax={70}
          aria-valuenow={Math.round(split.detailRatioPercent)}
          aria-label="Resize task detail and chat"
          tabIndex={0}
          onPointerDown={split.handlePointerDown}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            split.nudgeDetailRatio(event.key === 'ArrowLeft' ? -0.02 : 0.02);
          }}
          className={cn(
            'group relative z-20 shrink-0 cursor-col-resize touch-none',
            'bg-border/60',
            split.isDragging && 'bg-primary/30',
          )}
          style={{ width: TASK_SHEET_SPLIT_HIT_PX }}
        >
          <div
            className={cn(
              'pointer-events-none absolute top-1/2 left-1/2 flex h-10 w-1.5 -translate-x-1/2 -translate-y-1/2',
              'bg-border items-center justify-center rounded-full shadow-sm ring-1 ring-black/5',
              'opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100',
              split.isDragging && 'bg-primary/20 ring-primary/30 opacity-100',
            )}
          />
          <span className="sr-only">Drag to resize</span>
        </div>
      ) : null}

      <div
        className={cn(
          TASK_SHEET_CHAT_COLUMN_CLASS,
          'min-h-0 min-w-0 bg-white',
          split.isSplitRow && 'relative z-10 shrink-0',
        )}
        style={chatColumnStyle(split.isSplitRow)}
      >
        {chat}
      </div>
    </div>
  );
}
