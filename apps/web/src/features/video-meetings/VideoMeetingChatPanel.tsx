'use client';

import { Chat } from '@livekit/components-react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { CALL_ICON_BUTTON_CLASS } from './video-meeting-call-styles';

type VideoMeetingChatPanelProps = {
  open: boolean;
  onClose: () => void;
};

/** Right-hand chat sheet inside the call. Stays mounted so messages are not dropped. */
export function VideoMeetingChatPanel({ open, onClose }: VideoMeetingChatPanelProps) {
  const t = useTranslations('videoMeetings.room');
  const closeLabel = useTranslations('common')('close');

  return (
    <aside
      className={cn(
        'bg-background absolute inset-y-0 right-0 z-20 flex w-full max-w-80 flex-col border-l shadow-xl transition-transform duration-200 sm:w-80',
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
      )}
      inert={!open}
      data-lk-theme="default"
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
      <Chat className="min-h-0 flex-1" />
    </aside>
  );
}
