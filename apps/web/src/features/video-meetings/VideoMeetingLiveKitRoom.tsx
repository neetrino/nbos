'use client';

import '@livekit/components-react/styles.css';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { useTranslations } from 'next-intl';
import type { LiveKitJoinCredentials } from '@/lib/api/video-meetings';
import { VideoMeetingRecordingIndicator } from './VideoMeetingRecordingIndicator';

type VideoMeetingLiveKitRoomProps = {
  credentials: LiveKitJoinCredentials;
  onDisconnected: () => void;
  meetingId?: string;
  canControlRecording?: boolean;
  guestInviteToken?: string;
};

export function VideoMeetingLiveKitRoom({
  credentials,
  onDisconnected,
  meetingId,
  canControlRecording = false,
  guestInviteToken,
}: VideoMeetingLiveKitRoomProps) {
  const t = useTranslations('videoMeetings.room');

  return (
    <div className="flex min-h-[480px] flex-1 flex-col gap-3">
      <VideoMeetingRecordingIndicator
        compact
        meetingId={meetingId}
        canControl={canControlRecording}
        guestInviteToken={guestInviteToken}
      />
      <div className="border-border lk-room-shell relative min-h-[420px] flex-1 overflow-hidden rounded-xl border">
        <LiveKitRoom
          serverUrl={credentials.livekitUrl}
          token={credentials.token}
          connect
          audio
          video
          onDisconnected={onDisconnected}
          data-lk-theme="default"
          className="h-full min-h-[420px]"
        >
          <VideoConference />
        </LiveKitRoom>
      </div>
      <p className="text-muted-foreground sr-only">{t('controlsAria')}</p>
    </div>
  );
}
