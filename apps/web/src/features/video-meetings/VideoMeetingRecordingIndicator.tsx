'use client';

import { Circle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-errors';
import { cn } from '@/lib/utils';
import {
  guestRecordingStatus,
  videoMeetingsApi,
  type VideoMeetingRecordingGroup,
  type VideoMeetingRecordingStatus,
} from '@/lib/api/video-meetings';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CALL_ICON_BUTTON_CLASS } from './video-meeting-call-styles';
import { VideoMeetingRecordingElapsed } from './VideoMeetingRecordingElapsed';

type VideoMeetingRecordingIndicatorProps = {
  meetingId?: string;
  canControl?: boolean;
  /** Guest invite secret — polls status only; no start/stop. */
  guestInviteToken?: string;
  compact?: boolean;
  /** Round control for the in-call bar. */
  appearance?: 'panel' | 'icon';
  initialRecording?: VideoMeetingRecordingGroup | null;
};

function isCaptureLive(status: VideoMeetingRecordingStatus | undefined): boolean {
  return status === 'RECORDING' || status === 'PENDING';
}

function recordingStatusLabel(
  status: VideoMeetingRecordingStatus | undefined,
  copy: { live: string; saving: string; idle: string },
): string {
  if (isCaptureLive(status)) return copy.live;
  if (status === 'FINALIZING') return copy.saving;
  return copy.idle;
}

function recordingActionError(
  caught: unknown,
  copy: { unavailable: string; consent: string; failed: string },
): string {
  const message = caught instanceof Error ? caught.message : '';
  const status = caught instanceof ApiError ? caught.statusCode : undefined;
  if (status === 503 || message.includes('503')) return copy.unavailable;
  if (message.toLowerCase().includes('consent')) return copy.consent;
  return copy.failed;
}

/** Wired to S05 recording start/stop + consent-gated status. */
export function VideoMeetingRecordingIndicator({
  meetingId,
  canControl = false,
  guestInviteToken,
  compact,
  appearance = 'panel',
  initialRecording = null,
}: VideoMeetingRecordingIndicatorProps) {
  const t = useTranslations('videoMeetings.recording');
  const [recording, setRecording] = useState<VideoMeetingRecordingGroup | null>(initialRecording);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      if (guestInviteToken) {
        const status = await guestRecordingStatus(guestInviteToken);
        if (status.status === 'NONE') {
          setRecording(null);
        } else {
          setRecording({
            id: 'guest',
            status: status.status,
            startedAt: null,
            stoppedAt: null,
            assets: [],
          });
        }
        return;
      }
      if (!meetingId) return;
      const result = await videoMeetingsApi.getRecording(meetingId);
      setRecording(result.recording);
      setError(null);
    } catch {
      setError(t('loadError'));
    }
  }, [guestInviteToken, meetingId, t]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const active = isCaptureLive(recording?.status);
  const statusLabel = recordingStatusLabel(recording?.status, {
    live: t('recordingActive'),
    saving: t('saving'),
    idle: t('notRecording'),
  });
  const showControls = Boolean(canControl && meetingId && !guestInviteToken);

  const run = async (action: () => Promise<{ recording: VideoMeetingRecordingGroup }>) => {
    if (!meetingId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      setRecording(result.recording);
    } catch (caught) {
      const next = recordingActionError(caught, {
        unavailable: t('egressUnavailable'),
        consent: t('consentRequired'),
        failed: t('actionError'),
      });
      setError(next);
      toast.error(next);
    } finally {
      setBusy(false);
    }
  };

  if (appearance === 'icon') {
    return (
      <>
        <VideoMeetingRecordingElapsed startedAt={recording?.startedAt ?? null} running={active} />
        <RecordingIconButton
          active={active}
          busy={busy}
          enabled={showControls}
          error={error}
          startLabel={t('start')}
          stopLabel={t('stop')}
          onToggle={() => {
            if (!meetingId) return;
            void run(() =>
              active
                ? videoMeetingsApi.stopRecording(meetingId)
                : videoMeetingsApi.startRecording(meetingId),
            );
          }}
        />
      </>
    );
  }

  return (
    <div
      className={
        compact
          ? 'flex flex-wrap items-center gap-2'
          : 'border-border bg-muted/40 flex flex-col gap-2 rounded-lg border p-3'
      }
    >
      <div className="flex items-center gap-2 text-sm">
        <Circle
          className={
            active
              ? 'size-2 fill-current text-red-600'
              : 'text-muted-foreground size-2 fill-current'
          }
          aria-hidden
        />
        <span className="font-medium">{t('label')}</span>
        <span className="text-muted-foreground">{statusLabel}</span>
        <VideoMeetingRecordingElapsed startedAt={recording?.startedAt ?? null} running={active} />
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
      {showControls && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || active}
            onClick={() => void run(() => videoMeetingsApi.startRecording(meetingId!))}
          >
            {t('start')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || !active}
            onClick={() => void run(() => videoMeetingsApi.stopRecording(meetingId!))}
          >
            {t('stop')}
          </Button>
        </div>
      )}
    </div>
  );
}

function RecordingIconButton({
  active,
  busy,
  enabled,
  error,
  startLabel,
  stopLabel,
  onToggle,
}: {
  active: boolean;
  busy: boolean;
  enabled: boolean;
  error: string | null;
  startLabel: string;
  stopLabel: string;
  onToggle: () => void;
}) {
  if (!enabled && !active) return null;
  const label = active ? stopLabel : startLabel;

  return (
    <Tooltip>
      <TooltipTrigger
        delay={200}
        render={
          <button
            type="button"
            className={cn(
              CALL_ICON_BUTTON_CLASS,
              active
                ? 'bg-destructive hover:bg-destructive/90 border-transparent text-white hover:text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground',
            )}
            aria-label={error ?? label}
            aria-pressed={active}
            disabled={!enabled || busy}
            onClick={onToggle}
          />
        }
      >
        <Circle className={cn('size-3.5', active && 'fill-current')} aria-hidden />
      </TooltipTrigger>
      <TooltipContent side="top">{error ?? label}</TooltipContent>
    </Tooltip>
  );
}
