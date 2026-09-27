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

  const enabled = options.enabled;
  const modeKind = mode?.kind ?? null;
  const employeeMeetingId = mode?.kind === 'employee' ? mode.meetingId : undefined;
  const guestInviteToken = mode?.kind === 'guest' ? mode.inviteToken : undefined;

  const canFetchThread =
    (modeKind === 'employee' && Boolean(employeeMeetingId)) ||
    (modeKind === 'guest' && Boolean(guestInviteToken));

  const refresh = useCallback(async () => {
    if (modeKind === 'employee' && employeeMeetingId) {
      const thread = await videoMeetingThreadApi.getThread(employeeMeetingId);
      setItems(thread.items.filter(isMessageItem));
      return;
    }
    if (modeKind === 'guest' && guestInviteToken) {
      const thread = await guestThread(guestInviteToken);
      setItems(thread.items.filter(isGuestChatItem));
    }
  }, [modeKind, employeeMeetingId, guestInviteToken]);

  useEffect(() => {
    if (!enabled || !canFetchThread) {
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
  }, [modeKind, employeeMeetingId, guestInviteToken, enabled, canFetchThread, refresh]);

  useEffect(() => {
    if (!enabled || !canFetchThread) return;
    const tick = () => {
      void refresh().catch(() => undefined);
    };
    const id = window.setInterval(tick, VIDEO_MEETING_THREAD_POLL_MS);
    return () => window.clearInterval(id);
  }, [modeKind, employeeMeetingId, guestInviteToken, enabled, canFetchThread, refresh]);

  const postMessage = useCallback(
    async (body: string) => {
      if (!canFetchThread) return;
      setPosting(true);
      try {
        if (modeKind === 'employee' && employeeMeetingId) {
          await videoMeetingThreadApi.postMessage(employeeMeetingId, body);
        } else if (modeKind === 'guest' && guestInviteToken) {
          await guestPostMessage(guestInviteToken, body);
        }
        await refresh();
      } finally {
        setPosting(false);
      }
    },
    [canFetchThread, modeKind, employeeMeetingId, guestInviteToken, refresh],
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
