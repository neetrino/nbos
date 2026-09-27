'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  guestPostMessage,
  guestThread,
  type GuestVideoMeetingThreadItem,
  type GuestVideoMeetingThreadRecordingNote,
} from '@/lib/api/video-meetings-guest-thread';
import {
  videoMeetingThreadApi,
  type VideoMeetingThreadItem,
} from '@/lib/api/video-meetings-thread';
import { VIDEO_MEETING_THREAD_POLL_MS } from './constants';
import { threadHasNonTerminalRecording } from './video-meeting-thread-poll';

export type PersistedVideoMeetingChatMode =
  | { kind: 'employee'; meetingId: string }
  | { kind: 'guest'; inviteToken: string };

type ChatItem = VideoMeetingThreadItem | GuestVideoMeetingThreadItem;

function isMessageItem(item: ChatItem): item is Extract<ChatItem, { type: 'message' }> {
  return item.type === 'message';
}

function isGuestChatItem(
  item: GuestVideoMeetingThreadItem,
): item is
  | Extract<GuestVideoMeetingThreadItem, { type: 'message' }>
  | GuestVideoMeetingThreadRecordingNote {
  return item.type === 'message' || item.type === 'recording_note';
}

export function usePersistedVideoMeetingChat(
  mode: PersistedVideoMeetingChatMode | null,
  options: { enabled: boolean },
) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const refresh = useCallback(async () => {
    if (!mode) return;
    if (mode.kind === 'employee') {
      const thread = await videoMeetingThreadApi.getThread(mode.meetingId);
      setItems(thread.items.filter(isMessageItem));
      return;
    }
    const thread = await guestThread(mode.inviteToken);
    setItems(thread.items.filter(isGuestChatItem));
  }, [mode]);

  useEffect(() => {
    if (!mode || !options.enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void refresh()
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, options.enabled, refresh]);

  useEffect(() => {
    if (!mode || !options.enabled) return;
    const tick = () => {
      void refresh().catch(() => undefined);
    };
    const id = window.setInterval(tick, VIDEO_MEETING_THREAD_POLL_MS);
    return () => window.clearInterval(id);
  }, [mode, options.enabled, refresh]);

  const postMessage = useCallback(
    async (body: string) => {
      if (!mode) return;
      setPosting(true);
      try {
        if (mode.kind === 'employee') {
          await videoMeetingThreadApi.postMessage(mode.meetingId, body);
        } else {
          await guestPostMessage(mode.inviteToken, body);
        }
        await refresh();
      } finally {
        setPosting(false);
      }
    },
    [mode, refresh],
  );

  return { items, loading, posting, postMessage, refresh };
}

export function useEmployeeRoomThread(meetingId: string) {
  const [items, setItems] = useState<VideoMeetingThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const didScrollRef = useRef(false);

  const refresh = useCallback(async () => {
    const thread = await videoMeetingThreadApi.getThread(meetingId);
    setItems(thread.items);
    return thread.items;
  }, [meetingId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    didScrollRef.current = false;
    void refresh()
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [meetingId, refresh]);

  useEffect(() => {
    if (loading || didScrollRef.current) return;
    didScrollRef.current = true;
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [loading, items.length]);

  useEffect(() => {
    if (!threadHasNonTerminalRecording(items)) return;
    const id = window.setInterval(() => {
      void refresh().catch(() => undefined);
    }, VIDEO_MEETING_THREAD_POLL_MS);
    return () => window.clearInterval(id);
  }, [items, refresh]);

  const postMessage = useCallback(
    async (body: string) => {
      setPosting(true);
      try {
        await videoMeetingThreadApi.postMessage(meetingId, body);
        await refresh();
        bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
      } finally {
        setPosting(false);
      }
    },
    [meetingId, refresh],
  );

  return { items, loading, posting, postMessage, bottomRef };
}
