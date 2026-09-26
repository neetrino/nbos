'use client';

import '@livekit/components-styles';
import {
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import type { LiveKitJoinCredentials } from '@/lib/api/video-meetings';
import { VideoMeetingRoomControls } from './VideoMeetingRoomControls';

type VideoMeetingLiveKitRoomProps = {
  credentials: LiveKitJoinCredentials;
  onDisconnected: () => void;
};

function VideoMeetingStage() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <div className="bg-muted/30 relative min-h-0 flex-1 overflow-hidden rounded-xl">
      <GridLayout tracks={tracks} className="h-full">
        <ParticipantTile />
      </GridLayout>
      <RoomAudioRenderer />
    </div>
  );
}

export function VideoMeetingLiveKitRoom({
  credentials,
  onDisconnected,
}: VideoMeetingLiveKitRoomProps) {
  return (
    <div className="border-border/80 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
      <LiveKitRoom
        serverUrl={credentials.livekitUrl}
        token={credentials.token}
        connect
        audio
        video
        onDisconnected={onDisconnected}
        data-lk-theme="default"
        className="flex min-h-0 flex-1 flex-col"
      >
        <VideoMeetingStage />
        <VideoMeetingRoomControls />
      </LiveKitRoom>
    </div>
  );
}
