'use client';

import { useChat, useLocalParticipant } from '@livekit/components-react';
import { Send, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { VideoMeetingConsentActions } from './VideoMeetingConsentActions';
import { CALL_ICON_BUTTON_CLASS } from './video-meeting-call-styles';

type VideoMeetingChatPanelProps = {
  open: boolean;
  onClose: () => void;
  meetingId?: string;
};

/** Right-hand chat sheet. Stays mounted so messages survive closing the panel. */
export function VideoMeetingChatPanel({ open, onClose, meetingId }: VideoMeetingChatPanelProps) {
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
      <VideoMeetingChatThread />
      {meetingId ? (
        <div className="border-border border-t px-4 py-3">
          <VideoMeetingConsentActions compact meetingId={meetingId} />
        </div>
      ) : null}
    </aside>
  );
}

function VideoMeetingChatThread() {
  const t = useTranslations('videoMeetings.room');
  const { chatMessages, send, isSending } = useChat();
  const { localParticipant } = useLocalParticipant();
  const [draft, setDraft] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;
    void send(text);
    setDraft('');
  };

  return (
    <>
      <ol className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-2">
        {chatMessages.length === 0 ? (
          <li className="text-muted-foreground m-auto text-center text-sm">{t('chatEmpty')}</li>
        ) : (
          chatMessages.map((message) => (
            <ChatBubble
              key={`${message.timestamp}-${message.from?.identity ?? 'self'}`}
              mine={message.from?.identity === localParticipant.identity}
              author={message.from?.name || message.from?.identity || ''}
              text={message.message}
            />
          ))
        )}
      </ol>
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
          disabled={isSending || draft.trim().length === 0}
          aria-label={t('chatSend')}
        >
          <Send />
        </button>
      </form>
    </>
  );
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
