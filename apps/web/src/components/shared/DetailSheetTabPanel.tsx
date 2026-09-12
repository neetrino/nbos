'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { DETAIL_SHEET_TAB_PANEL_TRANSITION_CLASS } from './detail-sheet-classes';
import { shouldFreezeOutgoingTabPanel } from './detail-sheet-tab-panel';
import { cn } from '@/lib/utils';

/** Outgoing fade completes before tab body swaps (see transition duration in globals.css). */
const DETAIL_SHEET_TAB_PANEL_SWAP_MS = 280;

type FrozenTabPanel = {
  key: string;
  node: ReactNode;
};

export interface DetailSheetTabPanelProps {
  /** Current tab value — drives crossfade on change. */
  tabKey: string;
  children: ReactNode;
  className?: string;
}

/**
 * Crossfades sheet tab bodies (fade out → swap → fade in).
 * On the active tab, `children` render live. A deferred snapshot would reset
 * the caret in controlled inputs after every keystroke.
 */
export function DetailSheetTabPanel({ tabKey, children, className }: DetailSheetTabPanelProps) {
  const outgoing = useOutgoingTabSnapshot(tabKey, children);

  return (
    <div
      className={cn(
        DETAIL_SHEET_TAB_PANEL_TRANSITION_CLASS,
        outgoing != null && 'detail-sheet-tab-panel-fading',
        className,
      )}
    >
      {outgoing != null ? outgoing.node : children}
    </div>
  );
}

function useOutgoingTabSnapshot(tabKey: string, children: ReactNode): FrozenTabPanel | null {
  const shownTabRef = useRef(tabKey);
  const lastLiveChildrenRef = useRef(children);
  const [outgoing, setOutgoing] = useState<FrozenTabPanel | null>(null);

  useLayoutEffect(() => {
    if (shouldFreezeOutgoingTabPanel(shownTabRef.current, tabKey, outgoing != null)) {
      setOutgoing({ key: shownTabRef.current, node: lastLiveChildrenRef.current });
      return;
    }
    if (outgoing == null) {
      lastLiveChildrenRef.current = children;
    }
  }, [tabKey, children, outgoing]);

  useEffect(() => {
    if (outgoing == null) {
      return;
    }

    const timer = window.setTimeout(() => {
      shownTabRef.current = tabKey;
      setOutgoing(null);
    }, DETAIL_SHEET_TAB_PANEL_SWAP_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [outgoing, tabKey]);

  return outgoing;
}
