'use client';

import { Send, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { GuestVideoMeetingThreadItem } from '@/lib/api/video-meetings-guest-thread';
import type { VideoMeetingThreadMessage } from '@/lib/api/video-meetings-thread';
import { CALL_ICON_BUTTON_CLASS } from './video-meeting-call-styles';
import {
  usePersistedVideoMeetingChat,
  type PersistedVideoMeetingChatMode,
} from './use-persisted-video-meeting-chat';
import { recordingGroupStatusKey } from './video-meeting-recording-labels';

type VideoMeetingChatPanelProps = {
  open: boolean;
  onClose: () => void;
  chatMode: PersistedVideoMeetingChatMode | null;
  selfDisplayName?: string;
  selfEmployeeId?: string | null;
};

/** Right-hand chat sheet. Persisted room thread — not LiveKit transport chat. */
export function VideoMeetingChatPanel({
  open,
  onClose,
  chatMode,
  selfDisplayName,
  selfEmployeeId,
}: VideoMeetingChatPanelProps) {
  const t = useTranslations('videoMeetings.room');
  const closeLabel = useTranslations('common')('close');

  return (
    <aside
      className={cn(
        'bg-card border-border absolute inset-y-3 right-3 z-30 flex w-[min(22rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-3xl border shadow-2xl transition-transform duration-200',
        open ? 'translate-x-0' : 'pointer-events-none translate-x-[calc(100%+1.5rem)]',
      )}
      inert={!open}
    >
      <header className="border-border flex h-14 shrink-0 items-center justify-between border-b px-4">
        <h2 className="text-sm font-semibold">{t('chatTitle')}</h2>
        <button
          type="button"
          className={cn(CALL_ICON_BUTTON_CLASS, 'size-9')}
          aria-label={closeLabel}
          onClick={onClose}
        >
          <X />
        </button>
      </header>
      <PersistedChatThread
        chatMode={chatMode}
        enabled={open}
        selfDisplayName={selfDisplayName}
        selfEmployeeId={selfEmployeeId}
      />
    </aside>
  );
}

function PersistedChatThread({
  chatMode,
  enabled,
  selfDisplayName,
  selfEmployeeId,
}: {
  chatMode: PersistedVideoMeetingChatMode | null;
  enabled: boolean;
  selfDisplayName?: string;
  selfEmployeeId?: string | null;
}) {
  const t = useTranslations('videoMeetings.room');
  const tRecording = useTranslations('videoMeetings.recording');
  const { items, loading, posting, postMessage } = usePersistedVideoMeetingChat(chatMode, {
    enabled,
  });
  const [draft, setDraft] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || posting || !chatMode) return;
    void postMessage(text);
    setDraft('');
  };

  return (
    <>
      <ol className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-2">
        {loading ? (
          <li className="text-muted-foreground m-auto text-center text-sm">{t('chatLoading')}</li>
        ) : items.length === 0 ? (
          <li className="text-muted-foreground m-auto text-center text-sm">{t('chatEmpty')}</li>
        ) : (
          items.map((item) => (
            <ChatRow
              key={chatRowKey(item)}
              item={item}
              mine={isMine(item, chatMode, selfDisplayName, selfEmployeeId)}
              tRecording={tRecording}
            />
          ))
        )}
      </ol>
      {chatMode ? (
        <form onSubmit={submit} className="flex gap-2 px-3 pb-3">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('chatPlaceholder')}
            className="border-border bg-muted/40 h-11 min-w-0 flex-1 rounded-full border px-4 text-sm outline-none"
          />
          <button
            type="submit"
            className={cn(CALL_ICON_BUTTON_CLASS, 'size-11 shrink-0')}
            disabled={posting || draft.trim().length === 0}
            aria-label={t('chatSend')}
          >
            <Send />
          </button>
        </form>
      ) : null}
    </>
  );
}

function chatRowKey(item: VideoMeetingThreadMessage | GuestVideoMeetingThreadItem): string {
  if (item.type === 'recording_note') return `note-${item.at}`;
  return item.id;
}

function isMine(
  item: VideoMeetingThreadMessage | GuestVideoMeetingThreadItem,
  mode: PersistedVideoMeetingChatMode | null,
  selfDisplayName: string | undefined,
  selfEmployeeId: string | null | undefined,
): boolean {
  if (item.type !== 'message') return false;
  if (mode?.kind === 'employee' && selfEmployeeId && 'employeeId' in item) {
    return item.employeeId === selfEmployeeId;
  }
  if (mode?.kind === 'guest' && selfDisplayName) {
    return item.authorDisplayName === selfDisplayName;
  }
  return false;
}

function ChatRow({
  item,
  mine,
  tRecording,
}: {
  item: VideoMeetingThreadMessage | GuestVideoMeetingThreadItem;
  mine: boolean;
  tRecording: ReturnType<typeof useTranslations<'videoMeetings.recording'>>;
}) {
  if (item.type === 'recording_note') {
    return (
      <li className="text-muted-foreground text-center text-xs">
        {tRecording('label')}: {tRecording(recordingGroupStatusKey(item.status))}
      </li>
    );
  }

  return <ChatBubble mine={mine} author={item.authorDisplayName} text={item.body} />;
}

function ChatBubble({ mine, author, text }: { mine: boolean; author: string; text: string }) {
  return (
    <li
      className={cn('flex max-w-[85%] flex-col gap-1', mine ? 'items-end self-end' : 'self-start')}
    >
      {!mine && author ? (
        <span className="text-muted-foreground px-1 text-xs">{author}</span>
      ) : null}
      <p
        className={cn(
          'rounded-2xl px-3 py-2 text-sm',
          mine ? 'bg-primary text-primary-foreground' : 'bg-muted',
        )}
      >
        {text}
      </p>
    </li>
  );
}
