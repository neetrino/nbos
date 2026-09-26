'use client';

import { TrackToggle, useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Maximize2, MessageSquare, Mic, MonitorUp, Phone, Video } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { VideoMeetingRecordingIndicator } from './VideoMeetingRecordingIndicator';
import { CALL_HANGUP_BUTTON_CLASS, CALL_ICON_BUTTON_CLASS } from './video-meeting-call-styles';

type RoomExitProps = {
  canEnd: boolean;
  onLeave: () => void;
  onEnd: () => Promise<void>;
};

type VideoMeetingRoomControlsProps = RoomExitProps & {
  chatOpen: boolean;
  onToggleChat: () => void;
  meetingId?: string;
  canControlRecording?: boolean;
};

/** Bottom icon bar. The red handset ends the meeting for a host, or leaves for a guest. */
export function VideoMeetingRoomControls({
  canEnd,
  onLeave,
  onEnd,
  chatOpen,
  onToggleChat,
  meetingId,
  canControlRecording = false,
}: VideoMeetingRoomControlsProps) {
  const t = useTranslations('videoMeetings.room');
  const { ending, hangUp } = useRoomExitActions({ canEnd, onLeave, onEnd });

  return (
    <div
      className="border-border/80 relative flex shrink-0 items-center justify-center px-4 py-4"
      role="toolbar"
      aria-label={t('controlsAria')}
    >
      <div className="flex items-center gap-2">
        <TrackToggle
          source={Track.Source.Microphone}
          showIcon={false}
          className={CALL_ICON_BUTTON_CLASS}
        >
          <Mic aria-hidden />
          <span className="sr-only">{t('mic')}</span>
        </TrackToggle>
        <TrackToggle
          source={Track.Source.Camera}
          showIcon={false}
          className={CALL_ICON_BUTTON_CLASS}
        >
          <Video aria-hidden />
          <span className="sr-only">{t('camera')}</span>
        </TrackToggle>
        <TrackToggle
          source={Track.Source.ScreenShare}
          showIcon={false}
          className={CALL_ICON_BUTTON_CLASS}
        >
          <MonitorUp aria-hidden />
          <span className="sr-only">{t('shareScreen')}</span>
        </TrackToggle>
        <VideoMeetingRecordingIndicator
          appearance="icon"
          meetingId={meetingId}
          canControl={canControlRecording}
        />
        <button
          type="button"
          className={cn(CALL_ICON_BUTTON_CLASS, chatOpen && 'bg-foreground text-background')}
          aria-pressed={chatOpen}
          aria-label={t('chat')}
          onClick={onToggleChat}
        >
          <MessageSquare aria-hidden />
        </button>
      </div>
      <button
        type="button"
        className={cn(CALL_HANGUP_BUTTON_CLASS, 'absolute right-4')}
        aria-label={canEnd ? t('endCall') : t('leave')}
        disabled={ending}
        onClick={() => void hangUp()}
      >
        <Phone className="rotate-[135deg]" aria-hidden />
      </button>
    </div>
  );
}

type VideoMeetingMiniBarProps = RoomExitProps & {
  title: string;
  onExpand: () => void;
};

/** Collapsed call. Audio stays connected because LiveKit remains mounted. */
export function VideoMeetingMiniBar({
  title,
  onExpand,
  canEnd,
  onLeave,
  onEnd,
}: VideoMeetingMiniBarProps) {
  const t = useTranslations('videoMeetings.room');
  const { ending, hangUp } = useRoomExitActions({ canEnd, onLeave, onEnd });

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span className="bg-success size-2 shrink-0 rounded-full" aria-hidden />
      <p className="min-w-0 flex-1 truncate text-sm font-medium">{title}</p>
      <button
        type="button"
        className={cn(CALL_ICON_BUTTON_CLASS, 'size-9')}
        aria-label={t('expand')}
        onClick={onExpand}
      >
        <Maximize2 className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        className={cn(CALL_HANGUP_BUTTON_CLASS, 'size-9')}
        aria-label={canEnd ? t('endCall') : t('leave')}
        disabled={ending}
        onClick={() => void hangUp()}
      >
        <Phone className="size-4 rotate-[135deg]" aria-hidden />
      </button>
    </div>
  );
}

function useRoomExitActions({ canEnd, onLeave, onEnd }: RoomExitProps) {
  const room = useRoomContext();
  const [ending, setEnding] = useState(false);

  const leave = () => {
    onLeave();
    void room.disconnect(true);
  };

  const hangUp = async () => {
    if (!canEnd) {
      leave();
      return;
    }
    setEnding(true);
    try {
      await onEnd();
      leave();
    } catch {
      setEnding(false);
    }
  };

  return { ending, hangUp };
}
