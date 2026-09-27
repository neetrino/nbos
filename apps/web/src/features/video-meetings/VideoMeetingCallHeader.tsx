'use client';

import { Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { CALL_ICON_BUTTON_CLASS } from './video-meeting-call-styles';

type VideoMeetingCallHeaderProps = {
  title: string;
  onMinimize?: () => void;
};

export function VideoMeetingCallHeader({ title, onMinimize }: VideoMeetingCallHeaderProps) {
  const t = useTranslations('videoMeetings.room');

  return (
    <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2">
      <span className="bg-success size-2 shrink-0 rounded-full" aria-hidden />
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">{title}</h1>
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
