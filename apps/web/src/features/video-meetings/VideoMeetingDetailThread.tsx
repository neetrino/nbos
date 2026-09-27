'use client';

import { format } from 'date-fns';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { VideoMeetingStatus } from '@/lib/api/video-meetings';
import type { VideoMeetingThreadItem } from '@/lib/api/video-meetings-thread';
import { cn } from '@/lib/utils';
import { useEmployeeRoomThread } from './use-persisted-video-meeting-chat';
import { VideoMeetingThreadRecordingCard } from './VideoMeetingThreadRecordingCard';
import { CALL_ICON_BUTTON_CLASS } from './video-meeting-call-styles';

type VideoMeetingDetailThreadProps = {
  meetingId: string;
  roomStatus: VideoMeetingStatus;
  employeeId: string | null;
};

export function VideoMeetingDetailThread({
  meetingId,
  roomStatus,
  employeeId,
}: VideoMeetingDetailThreadProps) {
  const t = useTranslations('videoMeetings');
  const { items, loading, posting, postMessage, bottomRef } = useEmployeeRoomThread(meetingId);
  const showComposer = roomStatus !== 'CANCELLED';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ol className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
        {loading ? (
          <li className="text-muted-foreground text-sm">{t('thread.loading')}</li>
        ) : items.length === 0 ? (
          <li className="text-muted-foreground text-sm">{t('thread.empty')}</li>
        ) : (
          items.map((item) => (
            <ThreadRow
              key={`${item.type}-${item.id}`}
              item={item}
              meetingId={meetingId}
              employeeId={employeeId}
              t={t}
            />
          ))
        )}
        <li ref={bottomRef} aria-hidden className="h-px shrink-0" />
      </ol>
      {showComposer ? (
        <div className="shrink-0 px-5 py-3">
          <ThreadComposer
            busy={posting}
            onPost={(body) => void postMessage(body)}
            placeholder={t('thread.composerPlaceholder')}
            sendLabel={t('room.chatSend')}
          />
        </div>
      ) : null}
    </div>
  );
}

function ThreadRow({
  item,
  meetingId,
  employeeId,
  t,
}: {
  item: VideoMeetingThreadItem;
  meetingId: string;
  employeeId: string | null;
  t: ReturnType<typeof useTranslations<'videoMeetings'>>;
}) {
  if (item.type === 'message') {
    const mine = Boolean(employeeId && item.employeeId === employeeId);
    return (
      <li
        className={cn(
          'flex max-w-[90%] flex-col gap-1',
          mine ? 'items-end self-end' : 'self-start',
        )}
      >
        {!mine ? (
          <span className="text-muted-foreground px-1 text-xs">{item.authorDisplayName}</span>
        ) : null}
        <p
          className={cn(
            'rounded-2xl px-3 py-2 text-sm',
            mine ? 'bg-primary text-primary-foreground' : 'bg-muted',
          )}
        >
          {item.body}
        </p>
      </li>
    );
  }
  if (item.type === 'session') {
    return (
      <li className="flex justify-center py-1">
        <SessionMarker
          startedAt={item.startedAt}
          endedAt={item.endedAt}
          label={t('thread.sessionMarker')}
        />
      </li>
    );
  }
  return (
    <li className="flex justify-center py-1">
      <VideoMeetingThreadRecordingCard meetingId={meetingId} recording={item} />
    </li>
  );
}

function SessionMarker({
  startedAt,
  endedAt,
  label,
}: {
  startedAt: string | null;
  endedAt: string | null;
  label: string;
}) {
  const t = useTranslations('videoMeetings.thread');
  const when = startedAt ? format(new Date(startedAt), 'PPp') : t('sessionTimeUnknown');
  const duration = formatSessionDuration(startedAt, endedAt);

  return (
    <div className="border-border text-muted-foreground max-w-md rounded-full border px-3 py-1 text-center text-xs">
      <span className="font-medium">{label}</span>
      <span className="mx-1">·</span>
      <span>{when}</span>
      {duration ? (
        <>
          <span className="mx-1">·</span>
          <span>{t('sessionDuration', { duration })}</span>
        </>
      ) : null}
    </div>
  );
}

function formatSessionDuration(startedAt: string | null, endedAt: string | null): string | null {
  if (!startedAt || !endedAt) return null;
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return null;
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function ThreadComposer({
  busy,
  onPost,
  placeholder,
  sendLabel,
}: {
  busy: boolean;
  onPost: (body: string) => void;
  placeholder: string;
  sendLabel: string;
}) {
  const [draft, setDraft] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    onPost(text);
    setDraft('');
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        className="border-border bg-muted/40 h-10 min-w-0 flex-1 rounded-full border px-4 text-sm outline-none"
      />
      <button
        type="submit"
        className={cn(CALL_ICON_BUTTON_CLASS, 'size-10 shrink-0')}
        disabled={busy || draft.trim().length === 0}
        aria-label={sendLabel}
      >
        <Send />
      </button>
    </form>
  );
}
