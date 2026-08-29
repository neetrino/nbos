'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EDGE_ZONE_WIDTH } from './kanban.types';

interface KanbanScrollEdgeControlsProps {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  /** Mobile relies on swipe; edge controls are desktop-only. */
  isMobile: boolean;
  onHoverStart: (side: 'left' | 'right') => void;
  onHoverEnd: () => void;
}

/**
 * Left/right stage navigation for the horizontal kanban scroller.
 * Desktop keeps hover auto-scroll zones; mobile uses swipe only.
 */
export function KanbanScrollEdgeControls({
  canScrollLeft,
  canScrollRight,
  isMobile,
  onHoverStart,
  onHoverEnd,
}: KanbanScrollEdgeControlsProps) {
  if (isMobile) {
    return null;
  }

  return (
    <>
      <DesktopEdgeZone
        side="left"
        canScroll={canScrollLeft}
        onHoverStart={onHoverStart}
        onHoverEnd={onHoverEnd}
      />
      <DesktopEdgeZone
        side="right"
        canScroll={canScrollRight}
        onHoverStart={onHoverStart}
        onHoverEnd={onHoverEnd}
      />
    </>
  );
}

function DesktopEdgeZone({
  side,
  canScroll,
  onHoverStart,
  onHoverEnd,
}: {
  side: 'left' | 'right';
  canScroll: boolean;
  onHoverStart: (side: 'left' | 'right') => void;
  onHoverEnd: () => void;
}) {
  return (
    <div
      onMouseEnter={() => canScroll && onHoverStart(side)}
      onMouseLeave={onHoverEnd}
      className={cn(
        'absolute top-0 z-20 flex h-full items-center transition-opacity duration-150',
        side === 'left' ? 'left-0' : 'right-0',
        canScroll ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
      style={{ width: EDGE_ZONE_WIDTH }}
    >
      <div className="flex h-full w-full items-center justify-center">
        <div className="bg-background border-border flex h-7 w-7 items-center justify-center rounded-full border shadow-sm">
          {side === 'left' ? (
            <ChevronLeft size={14} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={14} className="text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
}
