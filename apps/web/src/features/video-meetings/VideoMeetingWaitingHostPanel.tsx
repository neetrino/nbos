'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { videoMeetingsApi, type WaitingParticipant } from '@/lib/api/video-meetings';
import { VIDEO_MEETING_WAITING_POLL_MS } from './constants';

type VideoMeetingWaitingHostPanelProps = {
  meetingId: string;
  enabled: boolean;
};

export function VideoMeetingWaitingHostPanel({
  meetingId,
  enabled,
}: VideoMeetingWaitingHostPanelProps) {
  const t = useTranslations('videoMeetings');
  const [waiting, setWaiting] = useState<WaitingParticipant[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const rows = await videoMeetingsApi.listWaiting(meetingId);
        if (!cancelled) setWaiting(rows);
      } catch {
        if (!cancelled) setWaiting([]);
      }
    };

    void tick();
    const timer = window.setInterval(() => void tick(), VIDEO_MEETING_WAITING_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [enabled, meetingId]);

  if (!enabled) return null;

  return (
    <aside className="border-border bg-card w-full max-w-xs rounded-lg border p-3 lg:w-72">
      <h2 className="mb-2 text-sm font-medium">{t('room.waitingGuests')}</h2>
      {waiting.length === 0 ? (
        <p className="text-muted-foreground text-xs">{t('room.noWaiting')}</p>
      ) : (
        <ul className="space-y-2">
          {waiting.map((guest) => (
            <li
              key={guest.participantId}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="truncate">{guest.displayName}</span>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="xs"
                  onClick={() => void videoMeetingsApi.admit(meetingId, guest.participantId)}
                >
                  {t('actions.admit')}
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => void videoMeetingsApi.reject(meetingId, guest.participantId)}
                >
                  {t('actions.reject')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
