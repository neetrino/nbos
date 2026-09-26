'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ErrorState, LoadingState } from '@/components/shared';
import { usePermission } from '@/lib/permissions';
import { VideoMeetingLiveKitRoom } from './VideoMeetingLiveKitRoom';
import { VideoMeetingWaitingHostPanel } from './VideoMeetingWaitingHostPanel';
import { useVideoMeetingRoomConnect } from './use-video-meeting-room-connect';

type VideoMeetingRoomPageProps = {
  meetingId: string;
};

export function VideoMeetingRoomPage({ meetingId }: VideoMeetingRoomPageProps) {
  const t = useTranslations('videoMeetings');
  const { me } = usePermission();
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
    <div className="flex h-full min-h-0 flex-col gap-4 lg:flex-row">
      <div className="min-w-0 flex-1">
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
