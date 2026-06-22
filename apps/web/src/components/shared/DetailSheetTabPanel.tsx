'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DETAIL_SHEET_TAB_PANEL_TRANSITION_CLASS } from './detail-sheet-classes';
import { cn } from '@/lib/utils';

/** Outgoing fade completes before tab body swaps (see transition duration in globals.css). */
const DETAIL_SHEET_TAB_PANEL_SWAP_MS = 280;

type DisplayedTabPanel = {
  key: string;
  node: ReactNode;
};

export interface DetailSheetTabPanelProps {
  /** Current tab value — drives crossfade on change. */
  tabKey: string;
  children: ReactNode;
  className?: string;
}

/** Crossfades sheet tab bodies (fade out → swap → fade in). */
export function DetailSheetTabPanel({ tabKey, children, className }: DetailSheetTabPanelProps) {
  const [displayed, setDisplayed] = useState<DisplayedTabPanel>({ key: tabKey, node: children });
  const swapTimerRef = useRef<number | null>(null);
  const isFading = displayed.key !== tabKey;

  useEffect(() => {
    if (tabKey === displayed.key) {
      setDisplayed((prev) => (prev.key === tabKey ? { key: tabKey, node: children } : prev));
      return;
    }

    if (swapTimerRef.current !== null) {
      window.clearTimeout(swapTimerRef.current);
    }

    swapTimerRef.current = window.setTimeout(() => {
      setDisplayed({ key: tabKey, node: children });
      swapTimerRef.current = null;
    }, DETAIL_SHEET_TAB_PANEL_SWAP_MS);

    return () => {
      if (swapTimerRef.current !== null) {
        window.clearTimeout(swapTimerRef.current);
        swapTimerRef.current = null;
      }
    };
  }, [tabKey, children, displayed.key]);

  return (
    <div
      className={cn(
        DETAIL_SHEET_TAB_PANEL_TRANSITION_CLASS,
        isFading && 'detail-sheet-tab-panel-fading',
        className,
      )}
    >
      {displayed.node}
    </div>
  );
}
