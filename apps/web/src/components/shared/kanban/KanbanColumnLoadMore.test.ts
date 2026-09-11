/**
 * @vitest-environment jsdom
 */
import { createElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KANBAN_COLUMN_LOAD_MORE_ROOT_MARGIN } from '@/features/shared/kanban/kanban-column-page';
import { KanbanColumnLoadMore } from './KanbanColumnLoadMore';

type ObserverRecord = {
  callback: IntersectionObserverCallback;
  rootMargin: string | undefined;
  disconnect: ReturnType<typeof vi.fn>;
};

let observers: ObserverRecord[] = [];
let mountedRoot: Root | null = null;

class MockIntersectionObserver {
  readonly callback: IntersectionObserverCallback;
  readonly disconnect: ReturnType<typeof vi.fn>;

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.disconnect = vi.fn();
    observers.push({
      callback,
      rootMargin: options?.rootMargin,
      disconnect: this.disconnect,
    });
  }

  observe(): void {}
  unobserve(): void {}
}

function triggerIntersect(isIntersecting: boolean): void {
  for (const observer of observers) {
    observer.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      observer as unknown as IntersectionObserver,
    );
  }
}

function renderSentinel(props: {
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}): void {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  mountedRoot = root;
  act(() => {
    root.render(createElement(KanbanColumnLoadMore, props));
  });
}

function rerenderSentinel(props: {
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}): void {
  if (!mountedRoot) throw new Error('No mounted sentinel');
  act(() => {
    mountedRoot?.render(createElement(KanbanColumnLoadMore, props));
  });
}

describe('KanbanColumnLoadMore', () => {
  beforeEach(() => {
    observers = [];
    mountedRoot = null;
    vi.stubGlobal(
      'IntersectionObserver',
      MockIntersectionObserver as unknown as typeof IntersectionObserver,
    );
  });

  afterEach(() => {
    act(() => {
      mountedRoot?.unmount();
    });
    mountedRoot = null;
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it('calls onLoadMore when the sentinel intersects and hasMore is true', () => {
    const onLoadMore = vi.fn();
    renderSentinel({ hasMore: true, onLoadMore });

    expect(observers).toHaveLength(1);
    expect(observers[0]?.rootMargin).toBe(KANBAN_COLUMN_LOAD_MORE_ROOT_MARGIN);
    act(() => triggerIntersect(true));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('does not observe while loadingMore is true', () => {
    const onLoadMore = vi.fn();
    renderSentinel({ hasMore: true, loadingMore: true, onLoadMore });

    expect(observers).toHaveLength(0);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('does not observe when hasMore is false', () => {
    const onLoadMore = vi.fn();
    renderSentinel({ hasMore: false, onLoadMore });

    expect(observers).toHaveLength(0);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('does not recreate the observer when onLoadMore identity changes', () => {
    const first = vi.fn();
    const second = vi.fn();
    renderSentinel({ hasMore: true, onLoadMore: first });
    rerenderSentinel({ hasMore: true, onLoadMore: second });

    expect(observers).toHaveLength(1);
    act(() => triggerIntersect(true));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
