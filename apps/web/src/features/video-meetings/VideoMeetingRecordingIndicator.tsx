'use client';

import { Circle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

type VideoMeetingRecordingIndicatorProps = {
  compact?: boolean;
};

/** S05 wires egress; until then show honest not-recording state and disabled controls. */
export function VideoMeetingRecordingIndicator({ compact }: VideoMeetingRecordingIndicatorProps) {
  const t = useTranslations('videoMeetings.recording');

  return (
    <div
      className={
        compact
          ? 'flex flex-wrap items-center gap-2'
          : 'border-border bg-muted/40 flex flex-col gap-2 rounded-lg border p-3'
      }
    >
      <div className="flex items-center gap-2 text-sm">
        <Circle className="text-muted-foreground size-2 fill-current" aria-hidden />
        <span className="font-medium">{t('label')}</span>
        <span className="text-muted-foreground">{t('notRecording')}</span>
      </div>
      {!compact && <p className="text-muted-foreground text-xs">{t('notAvailableYet')}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled>
          {t('startDisabled')}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled>
          {t('stopDisabled')}
        </Button>
      </div>
    </div>
  );
}
