'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatRecordingElapsed } from './video-meeting-recording-elapsed';
import { useDurationGuard } from './use-duration-guard';

const MS_PER_SECOND = 1000;

type VideoMeetingDurationGuardProps = {
  meetingId: string;
};

/** Team-only continuation prompt. Guests never mount this. */
export function VideoMeetingDurationGuard({ meetingId }: VideoMeetingDurationGuardProps) {
  const guard = useDurationGuard(meetingId);
  const t = useTranslations('videoMeetings.durationGuard');
  if (guard.phase !== 'warning') return null;

  const clock = formatRecordingElapsed(Math.ceil(guard.remainingMs / MS_PER_SECOND));
  const label = t('countdownAria', { time: clock });

  if (guard.centered) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-6">
        <GuardCard
          title={t('title')}
          hint={t('hint')}
          clock={clock}
          timeLabel={label}
          action={t('continue')}
          busy={guard.busy}
          error={guard.failed ? t('continueFailed') : null}
          prominent
          onContinue={() => void guard.continueMeeting()}
        />
      </div>
    );
  }

  return (
    <div className="absolute top-3 right-3 z-20 max-w-xs">
      <GuardCard
        title={t('title')}
        hint={t('hint')}
        clock={clock}
        timeLabel={label}
        action={t('continue')}
        busy={guard.busy}
        error={guard.failed ? t('continueFailed') : null}
        prominent={false}
        onContinue={() => void guard.continueMeeting()}
      />
    </div>
  );
}

function GuardCard({
  title,
  hint,
  clock,
  timeLabel,
  action,
  busy,
  error,
  prominent,
  onContinue,
}: {
  title: string;
  hint: string;
  clock: string;
  timeLabel: string;
  action: string;
  busy: boolean;
  error: string | null;
  prominent: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-neutral-950/90 px-5 py-4 text-center text-white shadow-lg">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-3xl font-semibold tabular-nums" aria-label={timeLabel}>
        {clock}
      </p>
      <p className="text-xs text-white/80">{hint}</p>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
      <Button
        type="button"
        disabled={busy}
        onClick={onContinue}
        className={cn(prominent && 'h-12 px-8 text-base')}
      >
        {action}
      </Button>
    </div>
  );
}
