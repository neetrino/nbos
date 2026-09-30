'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { SHEET_THREAD_NEAR_END_PX } from './internal-messenger.constants';

function distanceFromEnd(node: HTMLElement): number {
  return node.scrollHeight - node.scrollTop - node.clientHeight;
}

function isPinnedToEnd(node: HTMLElement): boolean {
  return distanceFromEnd(node) <= SHEET_THREAD_NEAR_END_PX;
}

function pinScrollerToEnd(node: HTMLElement, smooth: boolean): void {
  node.scrollTo({
    top: node.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto',
  });
}

/** Pin to the latest message unless the user is reading history; then show jump-to-end. */
export function useScrollThreadToEnd(
  containerRef: RefObject<HTMLElement | null>,
  lastMessageId: string | undefined,
  conversationId: string,
  lastMessageIsOwn: boolean,
): { showJumpToEnd: boolean; jumpToEnd: () => void } {
  const [showJumpToEnd, setShowJumpToEnd] = useState(false);
  const pinnedRef = useRef(true);
  const conversationRef = useRef(conversationId);

  const syncJumpVisibility = useCallback((node: HTMLElement) => {
    const pinned = isPinnedToEnd(node);
    pinnedRef.current = pinned;
    setShowJumpToEnd(!pinned);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const onScroll = () => {
      syncJumpVisibility(node);
    };
    node.addEventListener('scroll', onScroll, { passive: true });
    return () => node.removeEventListener('scroll', onScroll);
  }, [containerRef, conversationId, syncJumpVisibility]);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const switchedChat = conversationRef.current !== conversationId;
    conversationRef.current = conversationId;
    if (!switchedChat && !pinnedRef.current && !lastMessageIsOwn) return;
    pinnedRef.current = true;
    pinScrollerToEnd(node, false);
  }, [containerRef, conversationId, lastMessageId, lastMessageIsOwn]);

  const jumpToEnd = useCallback(() => {
    const node = containerRef.current;
    if (!node) return;
    pinnedRef.current = true;
    pinScrollerToEnd(node, true);
    setShowJumpToEnd(false);
  }, [containerRef]);

  return { showJumpToEnd, jumpToEnd };
}
