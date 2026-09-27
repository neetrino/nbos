'use client';

import '@livekit/components-styles';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { LiveKitJoinCredentials } from '@/lib/api/video-meetings';
import { VideoMeetingCallHeader } from './VideoMeetingCallHeader';
import { VideoMeetingChatPanel } from './VideoMeetingChatPanel';
import type { PersistedVideoMeetingChatMode } from './use-persisted-video-meeting-chat';
import { VideoMeetingMiniBar, VideoMeetingRoomControls } from './VideoMeetingRoomControls';
import {
  VideoMeetingDeviceNotice,
  VideoMeetingStage,
  type CallSelfPresence,
} from './VideoMeetingStage';
import { VideoMeetingRecordingReminderSlot } from './VideoMeetingRecordingReminder';
import { VideoMeetingWaitingHostPanel } from './VideoMeetingWaitingHostPanel';
import { VIDEO_MEETING_ROOM_OPTIONS } from './video-meeting-room-options';

type VideoMeetingLiveKitRoomProps = {
  credentials: LiveKitJoinCredentials;
  self: CallSelfPresence;
  canEnd: boolean;
  onArmLeave: () => void;
  onLeave: () => void;
  onAbortLeave: () => void;
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
  chatMode?: PersistedVideoMeetingChatMode | null;
  chatSelfDisplayName?: string;
  chatSelfEmployeeId?: string | null;
};

function roomFrameClass(framed: boolean, minimized: boolean): string {
  return cn(
    'flex min-h-0 flex-col',
    framed && 'border-border/80 overflow-hidden rounded-3xl border',
    !minimized && 'flex-1',
  );
}

/** Connected room. Camera and microphone stay off until the participant turns them on. */
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
        options={VIDEO_MEETING_ROOM_OPTIONS}
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

function CallRoomBody(props: VideoMeetingLiveKitRoomProps) {
  const collapsed = Boolean(props.minimized && props.onExpand);

  return (
    <>
      <div className={collapsed ? 'hidden' : 'flex min-h-0 flex-1 flex-col'}>
        <VideoMeetingCallSurface {...props} />
      </div>
      {collapsed && props.onExpand ? (
        <VideoMeetingMiniBar
          title={props.title ?? ''}
          onExpand={props.onExpand}
          canEnd={props.canEnd}
          onArmLeave={props.onArmLeave}
          onLeave={props.onLeave}
          onAbortLeave={props.onAbortLeave}
          onEnd={props.onEnd}
        />
      ) : null}
    </>
  );
}

function VideoMeetingCallSurface({
  title,
  meetingId,
  self,
  canEnd,
  canControlRecording,
  isHost,
  onArmLeave,
  onLeave,
  onAbortLeave,
  onEnd,
  onMinimize,
  chatMode,
  chatSelfDisplayName,
  chatSelfEmployeeId,
}: VideoMeetingLiveKitRoomProps) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <VideoMeetingCallHeader title={title ?? ''} onMinimize={onMinimize} />
      <div className="relative flex min-h-0 flex-1">
        <VideoMeetingStage self={self} />
        <VideoMeetingDeviceNotice />
        {meetingId ? (
          <div className="absolute top-3 left-3 z-10">
            <VideoMeetingWaitingHostPanel meetingId={meetingId} enabled={Boolean(isHost)} />
          </div>
        ) : null}
        <VideoMeetingRecordingReminderSlot
          meetingId={meetingId}
          enabled={Boolean(canControlRecording)}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-5">
          <div className="pointer-events-auto">
            <VideoMeetingRoomControls
              canEnd={canEnd}
              onArmLeave={onArmLeave}
              onLeave={onLeave}
              onAbortLeave={onAbortLeave}
              onEnd={onEnd}
              chatOpen={chatOpen}
              onToggleChat={() => setChatOpen((open) => !open)}
              meetingId={meetingId}
              canControlRecording={canControlRecording}
            />
          </div>
        </div>
        <VideoMeetingChatPanel
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          chatMode={chatMode ?? (meetingId ? { kind: 'employee', meetingId } : null)}
          selfDisplayName={chatSelfDisplayName ?? self.name}
          selfEmployeeId={chatSelfEmployeeId}
        />
      </div>
    </>
  );
}
