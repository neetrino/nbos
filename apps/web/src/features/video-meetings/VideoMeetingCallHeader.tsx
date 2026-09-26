'use client';

import { Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { VideoMeetingConsentActions } from './VideoMeetingConsentActions';
import { CALL_ICON_BUTTON_CLASS } from './video-meeting-call-styles';

type VideoMeetingCallHeaderProps = {
  title: string;
  meetingId?: string;
  onMinimize?: () => void;
};

export function VideoMeetingCallHeader({
  title,
  meetingId,
  onMinimize,
}: VideoMeetingCallHeaderProps) {
  const t = useTranslations('videoMeetings.room');

  return (
    <header className="border-border flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b px-4 py-2">
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h1>
      {meetingId ? <VideoMeetingConsentActions compact meetingId={meetingId} /> : null}
      {onMinimize ? (
        <button
          type="button"
          className={cn(CALL_ICON_BUTTON_CLASS, 'size-9 shrink-0')}
          aria-label={t('minimize')}
          onClick={onMinimize}
        >
          <Minus aria-hidden />
        </button>
      ) : null}
    </header>
  );
}
