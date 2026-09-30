'use client';

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';

const PILL_TRANSITION_MS = 300;

type PillBox = {
  top: number;
  height: number;
  ready: boolean;
};

/** Sliding accent behind the active sidebar module row. */
export function SidebarActiveNavPill({
  listRef,
  watchKey,
}: {
  listRef: RefObject<HTMLElement | null>;
  watchKey: string;
}) {
  const [box, setBox] = useState<PillBox | null>(null);

  const publish = useCallback(() => {
    const list = listRef.current;
    if (!list) {
      setBox(null);
      return;
    }
    const active = list.querySelector<HTMLElement>('[data-sidebar-nav-active="true"]');
    if (!active) {
      setBox((current) => (current ? { ...current, ready: false } : null));
      return;
    }
    const listRect = list.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    setBox({
      top: activeRect.top - listRect.top + list.scrollTop,
      height: activeRect.height,
      ready: true,
    });
  }, [listRef]);

  useLayoutEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (!cancelled) publish();
    });
    const list = listRef.current;
    if (!list) {
      return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
      };
    }
    const resizeObserver = new ResizeObserver(() => publish());
    resizeObserver.observe(list);
    const active = list.querySelector('[data-sidebar-nav-active="true"]');
    if (active) resizeObserver.observe(active);
    const scrollParent = list.closest('[class*="overflow-y-auto"]');
    scrollParent?.addEventListener('scroll', publish, { passive: true });
    window.addEventListener('resize', publish);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      scrollParent?.removeEventListener('scroll', publish);
      window.removeEventListener('resize', publish);
    };
  }, [listRef, publish, watchKey]);

  if (!box) return null;

  return (
    <span
      aria-hidden
      className="bg-sidebar-accent pointer-events-none absolute inset-x-0 z-0 rounded-xl"
      style={{
        top: box.top,
        height: box.height,
        opacity: box.ready ? 1 : 0,
        transitionProperty: 'top, height, opacity',
        transitionDuration: `${PILL_TRANSITION_MS}ms`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    />
  );
}

export function SidebarNavListShell({
  watchKey,
  children,
}: {
  watchKey: string;
  children: ReactNode;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  return (
    <ul ref={listRef} className="relative space-y-0">
      <SidebarActiveNavPill listRef={listRef} watchKey={watchKey} />
      {children}
    </ul>
  );
}
