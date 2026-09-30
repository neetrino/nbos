'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';
import { cn } from '@/lib/utils';

export type ConversationSelectionRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const SELECTION_TRANSITION_CLASS =
  'transition-[top,height,left,width] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

export function ConversationSelectionCard({
  rect,
  ready,
}: {
  rect: ConversationSelectionRect | null;
  ready: boolean;
}) {
  if (!rect) return null;
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute z-0 rounded-[17px] bg-white shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.1)]',
        ready && SELECTION_TRANSITION_CLASS,
      )}
      style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
    />
  );
}

export function useConversationSelection(
  containerRef: RefObject<HTMLElement | null>,
  activeId: string | null,
): { rect: ConversationSelectionRect | null; ready: boolean } {
  const [rect, setRect] = useState<ConversationSelectionRect | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      publishSelection(containerRef.current, activeId, setRect, setReady);
    });

    const container = containerRef.current;
    if (!container || !activeId) {
      return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
      };
    }

    const republish = () => publishSelection(containerRef.current, activeId, setRect, setReady);
    const resizeObserver = new ResizeObserver(republish);
    resizeObserver.observe(container);
    const mutationObserver = new MutationObserver(republish);
    mutationObserver.observe(container, { childList: true, subtree: true });
    const active = findConversationRow(container, activeId);
    if (active) resizeObserver.observe(active);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [activeId, containerRef]);

  return { rect, ready };
}

function publishSelection(
  container: HTMLElement | null,
  activeId: string | null,
  setRect: (rect: ConversationSelectionRect | null) => void,
  setReady: (ready: boolean) => void,
) {
  const active = container && activeId ? findConversationRow(container, activeId) : null;
  if (!container || !active) {
    setRect(null);
    setReady(false);
    return;
  }
  revealConversationRow(container, active);
  setRect(measureConversationRow(active));
  setReady(true);
}

function revealConversationRow(container: HTMLElement, row: HTMLElement): void {
  const rowTop = row.offsetTop;
  const rowBottom = rowTop + row.offsetHeight;
  const viewTop = container.scrollTop;
  const viewBottom = viewTop + container.clientHeight;
  if (rowTop >= viewTop && rowBottom <= viewBottom) return;
  row.scrollIntoView({ block: 'nearest' });
}

function findConversationRow(container: HTMLElement, activeId: string): HTMLElement | null {
  const rows = container.querySelectorAll<HTMLElement>('[data-conversation-id]');
  for (const row of rows) {
    if (row.dataset.conversationId === activeId) return row;
  }
  return null;
}

function measureConversationRow(row: HTMLElement): ConversationSelectionRect {
  return {
    top: row.offsetTop,
    left: row.offsetLeft,
    width: row.offsetWidth,
    height: row.offsetHeight,
  };
}
