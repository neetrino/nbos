'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EDGE_ZONE_WIDTH } from './kanban.types';

interface KanbanScrollEdgeControlsProps {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  /** Mobile: discrete step buttons without gradient fades. */
  isMobile: boolean;
  onStep: (side: 'left' | 'right') => void;
  onHoverStart: (side: 'left' | 'right') => void;
  onHoverEnd: () => void;
}

/**
 * Left/right stage navigation for the horizontal kanban scroller.
 * Mobile uses solid step buttons (no edge glow); desktop keeps hover auto-scroll zones.
 */
export function KanbanScrollEdgeControls({
  canScrollLeft,
  canScrollRight,
  isMobile,
  onStep,
  onHoverStart,
  onHoverEnd,
}: KanbanScrollEdgeControlsProps) {
  if (isMobile) {
    return (
      <>
        <MobileStepButton side="left" enabled={canScrollLeft} onStep={onStep} />
        <MobileStepButton side="right" enabled={canScrollRight} onStep={onStep} />
      </>
    );
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

function MobileStepButton({
  side,
  enabled,
  onStep,
}: {
  side: 'left' | 'right';
  enabled: boolean;
  onStep: (side: 'left' | 'right') => void;
}) {
  return (
    <button
      type="button"
      aria-label={side === 'left' ? 'Previous stage' : 'Next stage'}
      disabled={!enabled}
      onClick={() => onStep(side)}
      className={cn(
        'border-border bg-background absolute top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm',
        side === 'left' ? 'left-1' : 'right-1',
        enabled ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      {side === 'left' ? (
        <ChevronLeft size={14} className="text-muted-foreground" />
      ) : (
        <ChevronRight size={14} className="text-muted-foreground" />
      )}
    </button>
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
