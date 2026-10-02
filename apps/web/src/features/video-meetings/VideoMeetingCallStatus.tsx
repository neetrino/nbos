'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

type VideoMeetingCallStatusProps = {
  expanded: boolean;
  shellClass: string;
  phase: string;
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
  onExpand: () => void;
};

export function VideoMeetingCallStatus({
  expanded,
  shellClass,
  phase,
  message,
  onRetry,
  onDismiss,
  onExpand,
}: VideoMeetingCallStatusProps) {
  const t = useTranslations('videoMeetings.room');
  const common = useTranslations('common');

  if (!expanded) {
    return (
      <button
        type="button"
        className={`${shellClass} px-4 py-3 text-left text-sm`}
        onClick={onExpand}
      >
        {message}
      </button>
    );
  }

  return (
    <div className={`${shellClass} items-center justify-center gap-3 p-6 text-center`}>
      <p className="text-sm">{message}</p>
      {phase === 'error' || phase === 'unavailable' ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          {common('tryAgain')}
        </Button>
      ) : null}
      <Button type="button" variant="ghost" onClick={onDismiss}>
        {t('leave')}
      </Button>
    </div>
  );
}
