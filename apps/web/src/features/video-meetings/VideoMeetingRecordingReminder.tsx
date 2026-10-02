'use client';

import { X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { videoMeetingsApi, type VideoMeetingRecordingStatus } from '@/lib/api/video-meetings';

const RECORDING_REMINDER_FIRST_DELAY_MS = 8_000;
const RECORDING_REMINDER_REPEAT_MS = 120_000;
const RECORDING_REMINDER_POLL_MS = 5_000;

function isCaptureBusy(status: VideoMeetingRecordingStatus | undefined): boolean {
  return status === 'RECORDING' || status === 'PENDING' || status === 'FINALIZING';
}

/** Host-only placement above the call controls. */
export function VideoMeetingRecordingReminderSlot({
  meetingId,
  enabled,
}: {
  meetingId?: string;
  enabled: boolean;
}) {
  if (!enabled || !meetingId) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-10 flex justify-center px-4">
      <div className="pointer-events-auto">
        <VideoMeetingRecordingReminder meetingId={meetingId} />
      </div>
    </div>
  );
}

function useRecordingReminder(meetingId: string) {
  const t = useTranslations('videoMeetings.recording');
  const [live, setLive] = useState(false);
  const [visible, setVisible] = useState(false);
  const [holdUntil, setHoldUntil] = useState(0);
  const applyLive = useCallback((next: boolean) => {
    setLive(next);
    if (next) setVisible(false);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const result = await videoMeetingsApi.getRecording(meetingId);
      applyLive(isCaptureBusy(result.recording?.status));
    } catch {
      applyLive(false);
    }
  }, [applyLive, meetingId]);

  useEffect(() => {
    const kick = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), RECORDING_REMINDER_POLL_MS);
    return () => {
      window.clearTimeout(kick);
      window.clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    if (live) return undefined;
    const remaining = holdUntil - Date.now();
    const delay = remaining > 0 ? remaining : RECORDING_REMINDER_FIRST_DELAY_MS;
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [live, holdUntil]);

  const start = () =>
    videoMeetingsApi
      .startRecording(meetingId)
      .then((result) => applyLive(isCaptureBusy(result.recording.status)))
      .catch(() => toast.error(t('actionError')));

  const dismiss = () => {
    setVisible(false);
    setHoldUntil(Date.now() + RECORDING_REMINDER_REPEAT_MS);
  };

  return { visible: visible && !live, start, dismiss };
}

/** Small status that asks the host to start recording when capture is off. */
function VideoMeetingRecordingReminder({ meetingId }: { meetingId: string }) {
  const t = useTranslations('videoMeetings.recording');
  const { visible, start, dismiss } = useRecordingReminder(meetingId);
  if (!visible) return null;

  return (
    <div
      className="bg-background/95 border-border flex items-center gap-3 rounded-full border px-3 py-1.5 text-xs shadow-lg"
      role="status"
    >
      <span>{t('reminder')}</span>
      <button type="button" className="text-primary font-medium" onClick={() => void start()}>
        {t('reminderStart')}
      </button>
      <button type="button" aria-label={t('reminderDismiss')} onClick={dismiss}>
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
