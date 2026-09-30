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
        'pointer-events-none absolute z-0 rounded-[17px] border border-[#c7d2fe] bg-[#eef2ff] shadow-[0_2px_8px_rgba(79,70,229,0.12),0_1px_2px_rgba(15,23,42,0.06)]',
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

    const observer = new ResizeObserver(() => {
      publishSelection(containerRef.current, activeId, setRect, setReady);
    });
    observer.observe(container);
    const active = findConversationRow(container, activeId);
    if (active) observer.observe(active);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
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
  setRect(measureConversationRow(active));
  setReady(true);
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
