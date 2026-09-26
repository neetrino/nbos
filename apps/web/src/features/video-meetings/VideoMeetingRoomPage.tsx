'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ErrorState, LoadingState } from '@/components/shared';
import { APP_MAIN_CONTENT_FILL_HEIGHT_CLASS } from '@/components/layout/app-layout-constants';
import { usePermission } from '@/lib/permissions';
import { VideoMeetingConsentActions } from './VideoMeetingConsentActions';
import { VideoMeetingLiveKitRoom } from './VideoMeetingLiveKitRoom';
import { VideoMeetingRecordingIndicator } from './VideoMeetingRecordingIndicator';
import { VideoMeetingWaitingHostPanel } from './VideoMeetingWaitingHostPanel';
import { useVideoMeetingRoomConnect } from './use-video-meeting-room-connect';

type VideoMeetingRoomPageProps = {
  meetingId: string;
};

export function VideoMeetingRoomPage({ meetingId }: VideoMeetingRoomPageProps) {
  const t = useTranslations('videoMeetings');
  const { me, can } = usePermission();
  const { phase, card, credentials, errorMessage, connect } = useVideoMeetingRoomConnect(
    meetingId,
    t('room.tokenError'),
  );

  useEffect(() => {
    void connect();
  }, [connect]);

  const isHost = useMemo(
    () => Boolean(me && card && (me.id === card.hostEmployeeId || me.id === card.ownerEmployeeId)),
    [me, card],
  );
  const canControlRecording = Boolean(isHost && can('EDIT', 'VIDEO_MEETINGS'));

  if (phase === 'loading') {
    return (
      <div className="flex flex-col gap-3">
        <LoadingState count={3} />
        <p className="text-muted-foreground text-center text-sm">{t('room.connecting')}</p>
      </div>
    );
  }

  if (phase === 'inactive') {
    return (
      <div className="flex flex-col items-center gap-3">
        <ErrorState description={t('room.notActive')} onRetry={() => void connect()} />
        <Link href={`/video-meetings/${meetingId}`} className="text-primary text-sm underline">
          {t('detail.title')}
        </Link>
      </div>
    );
  }

  if (phase === 'unavailable' || phase === 'error') {
    return (
      <ErrorState
        description={errorMessage || t('room.tokenError')}
        onRetry={() => void connect()}
      />
    );
  }

  if (!credentials) {
    return <ErrorState description={t('room.tokenError')} onRetry={() => void connect()} />;
  }

  return (
    <div
      className={`flex min-h-0 flex-col gap-3 lg:flex-row ${APP_MAIN_CONTENT_FILL_HEIGHT_CLASS}`}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        <div className="border-border/70 bg-card/50 flex shrink-0 flex-wrap items-center gap-2 rounded-lg border px-3 py-2">
          <VideoMeetingRecordingIndicator
            compact
            meetingId={meetingId}
            canControl={canControlRecording}
          />
          <VideoMeetingConsentActions meetingId={meetingId} />
        </div>
        <VideoMeetingLiveKitRoom
          credentials={credentials}
          onDisconnected={() => {
            void connect();
          }}
        />
      </div>
      <VideoMeetingWaitingHostPanel meetingId={meetingId} enabled={isHost} />
    </div>
  );
}
