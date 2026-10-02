// @vitest-environment jsdom

import { act, createElement, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MessengerVisibleReadCoalescer } from './messenger-visible-read';
import { useVisibleConversationRead } from './use-visible-conversation-read';

describe('visible thread read', () => {
  afterEach(() => {
    vi.useRealTimers();
    setVisibility('visible');
  });

  it('does not send while the document is hidden', () => {
    vi.useFakeTimers();
    const send = vi.fn();
    const coalescer = new MessengerVisibleReadCoalescer(300, send);
    coalescer.note({ conversationId: 'c1', threadMounted: true, documentVisible: false });
    vi.advanceTimersByTime(300);
    expect(send).not.toHaveBeenCalled();
  });

  it('sends once for a visible open thread', () => {
    vi.useFakeTimers();
    const send = vi.fn();
    const coalescer = new MessengerVisibleReadCoalescer(300, send);
    coalescer.note({ conversationId: 'c1', threadMounted: true, documentVisible: true });
    vi.advanceTimersByTime(300);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith('c1');
  });

  it('coalesces a burst into one read', () => {
    vi.useFakeTimers();
    const send = vi.fn();
    const coalescer = new MessengerVisibleReadCoalescer(300, send);
    for (let index = 0; index < 5; index += 1) {
      coalescer.note({ conversationId: 'c1', threadMounted: true, documentVisible: true });
    }
    vi.advanceTimersByTime(300);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('does not mark read from a hidden document and does mark a visible thread', async () => {
    vi.useFakeTimers();
    const markRead = vi.fn();
    setVisibility('hidden');
    const hidden = mountReadProbe(markRead, 'm1');
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(markRead).not.toHaveBeenCalled();
    hidden.unmount();

    setVisibility('visible');
    const visible = mountReadProbe(markRead, 'm1');
    await act(async () => {
      visible.setLatest('m2');
      visible.setLatest('m3');
      vi.advanceTimersByTime(300);
    });
    expect(markRead).toHaveBeenCalledTimes(1);
    expect(markRead).toHaveBeenCalledWith('c1');
    visible.unmount();
  });
});

function setVisibility(state: 'hidden' | 'visible'): void {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
}

function mountReadProbe(markRead: (conversationId: string) => void, latest: string) {
  const container = document.createElement('div');
  const root = createRoot(container);
  const published: { setLatest: (id: string) => void } = { setLatest: () => undefined };
  act(() => {
    root.render(
      createElement(Probe, {
        latest,
        markRead,
        onReady: (setLatest) => {
          published.setLatest = setLatest;
        },
      }),
    );
  });
  return {
    setLatest(id: string) {
      act(() => published.setLatest(id));
    },
    unmount() {
      act(() => root.unmount());
    },
  };
}

function Probe(props: {
  latest: string;
  markRead: (conversationId: string) => void;
  onReady: (setLatest: (id: string) => void) => void;
}): ReactNode {
  const [latest, setLatest] = useState(props.latest);
  props.onReady(setLatest);
  useVisibleConversationRead({
    conversationId: 'c1',
    threadMounted: true,
    latestMessageId: latest,
    markRead: props.markRead,
  });
  return null;
}
