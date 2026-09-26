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
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { LiveKitJoinCredentials } from '@/lib/api/video-meetings';
import { VideoMeetingCallHeader } from './VideoMeetingCallHeader';
import { VideoMeetingChatPanel } from './VideoMeetingChatPanel';
import { VideoMeetingMiniBar, VideoMeetingRoomControls } from './VideoMeetingRoomControls';
import { VideoMeetingWaitingHostPanel } from './VideoMeetingWaitingHostPanel';

type VideoMeetingLiveKitRoomProps = {
  credentials: LiveKitJoinCredentials;
  canEnd: boolean;
  onLeave: () => void;
  onEnd: () => Promise<void>;
  onDisconnected: () => void;
  onConnected?: () => void;
  title?: string;
  meetingId?: string;
  canControlRecording?: boolean;
  isHost?: boolean;
  minimized?: boolean;
  onMinimize?: () => void;
  onExpand?: () => void;
  framed?: boolean;
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
    <div className="bg-muted/40 relative min-h-0 min-w-0 flex-1" data-lk-theme="default">
      <GridLayout tracks={tracks} className="h-full">
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}

function VideoMeetingCallSurface({
  title,
  meetingId,
  canEnd,
  canControlRecording,
  isHost,
  onLeave,
  onEnd,
  onMinimize,
}: Omit<
  VideoMeetingLiveKitRoomProps,
  'credentials' | 'onDisconnected' | 'minimized' | 'onExpand' | 'framed'
>) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <VideoMeetingCallHeader title={title ?? ''} meetingId={meetingId} onMinimize={onMinimize} />
      <div className="relative flex min-h-0 flex-1">
        <VideoMeetingStage />
        {meetingId ? (
          <div className="absolute top-3 left-3 z-10">
            <VideoMeetingWaitingHostPanel meetingId={meetingId} enabled={Boolean(isHost)} />
          </div>
        ) : null}
        <VideoMeetingChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
      <VideoMeetingRoomControls
        canEnd={canEnd}
        onLeave={onLeave}
        onEnd={onEnd}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((open) => !open)}
        meetingId={meetingId}
        canControlRecording={canControlRecording}
      />
    </>
  );
}

function roomFrameClass(framed: boolean, minimized: boolean): string {
  return cn(
    'flex min-h-0 flex-col',
    framed && 'border-border/80 overflow-hidden rounded-2xl border',
    !minimized && 'flex-1',
  );
}

/** Connected room. `audio` and `video` stay off until the participant turns them on. */
export function VideoMeetingLiveKitRoom(props: VideoMeetingLiveKitRoomProps) {
  const { credentials, onDisconnected, onConnected, minimized = false, framed = true } = props;

  return (
    <div className={roomFrameClass(Boolean(framed), minimized)}>
      <LiveKitRoom
        serverUrl={credentials.livekitUrl}
        token={credentials.token}
        connect
        audio={false}
        video={false}
        onDisconnected={onDisconnected}
        onConnected={onConnected}
        className={cn('flex min-h-0 flex-col', !minimized && 'flex-1')}
      >
        <RoomAudioRenderer />
        <CallRoomBody {...props} minimized={minimized} />
      </LiveKitRoom>
    </div>
  );
}

function CallRoomBody({
  canEnd,
  onLeave,
  onEnd,
  title,
  meetingId,
  canControlRecording,
  isHost,
  minimized,
  onMinimize,
  onExpand,
}: VideoMeetingLiveKitRoomProps) {
  if (minimized && onExpand) {
    return (
      <VideoMeetingMiniBar
        title={title ?? ''}
        onExpand={onExpand}
        canEnd={canEnd}
        onLeave={onLeave}
        onEnd={onEnd}
      />
    );
  }

  return (
    <VideoMeetingCallSurface
      title={title}
      meetingId={meetingId}
      canEnd={canEnd}
      canControlRecording={canControlRecording}
      isHost={isHost}
      onLeave={onLeave}
      onEnd={onEnd}
      onMinimize={onMinimize}
    />
  );
}
