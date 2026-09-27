'use client';

import { useRoomContext, useTrackToggle } from '@livekit/components-react';
import { Track } from 'livekit-client';
import {
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  MonitorOff,
  MonitorUp,
  Phone,
  Video,
  VideoOff,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { useTranslations } from 'next-intl';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { VideoMeetingRecordingIndicator } from './VideoMeetingRecordingIndicator';
import {
  CALL_HANGUP_BUTTON_CLASS,
  CALL_ICON_BUTTON_CLASS,
  CALL_MEDIA_OFF_CLASS,
  CALL_MEDIA_ON_CLASS,
} from './video-meeting-call-styles';

type RoomExitProps = {
  canEnd: boolean;
  onArmLeave: () => void;
  onLeave: () => void;
  onAbortLeave: () => void;
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
  onArmLeave,
  onLeave,
  onAbortLeave,
  onEnd,
  chatOpen,
  onToggleChat,
  meetingId,
  canControlRecording = false,
}: VideoMeetingRoomControlsProps) {
  const t = useTranslations('videoMeetings.room');
  const { ending, hangUp } = useRoomExitActions({
    canEnd,
    onArmLeave,
    onLeave,
    onAbortLeave,
    onEnd,
  });

  return (
    <TooltipProvider delay={200}>
      <div
        className="bg-background/85 border-border/70 flex items-center gap-1.5 rounded-full border px-2 py-2 shadow-xl backdrop-blur-md"
        role="toolbar"
        aria-label={t('controlsAria')}
      >
        <CallMediaButtons
          chatOpen={chatOpen}
          onToggleChat={onToggleChat}
          meetingId={meetingId}
          canControlRecording={canControlRecording}
        />
        <CallHangupButton canEnd={canEnd} ending={ending} onHangUp={() => void hangUp()} />
      </div>
    </TooltipProvider>
  );
}

function CallMediaButtons({
  chatOpen,
  onToggleChat,
  meetingId,
  canControlRecording,
}: Pick<
  VideoMeetingRoomControlsProps,
  'chatOpen' | 'onToggleChat' | 'meetingId' | 'canControlRecording'
>) {
  const t = useTranslations('videoMeetings.room');

  return (
    <>
      <MediaToggle
        source={Track.Source.Microphone}
        enabledIcon={Mic}
        disabledIcon={MicOff}
        labelOn={t('micOn')}
        labelOff={t('micOff')}
      />
      <MediaToggle
        source={Track.Source.Camera}
        enabledIcon={Video}
        disabledIcon={VideoOff}
        labelOn={t('cameraOn')}
        labelOff={t('cameraOff')}
      />
      <MediaToggle
        source={Track.Source.ScreenShare}
        enabledIcon={MonitorUp}
        disabledIcon={MonitorOff}
        labelOn={t('shareOn')}
        labelOff={t('shareOff')}
      />
      <VideoMeetingRecordingIndicator
        appearance="icon"
        meetingId={meetingId}
        canControl={canControlRecording}
      />
      <HoverCaption label={t('chat')}>
        <button
          type="button"
          className={cn(CALL_ICON_BUTTON_CLASS, chatOpen && 'bg-foreground text-background')}
          aria-pressed={chatOpen}
          aria-label={t('chat')}
          onClick={onToggleChat}
        >
          <MessageSquare aria-hidden />
        </button>
      </HoverCaption>
    </>
  );
}

function MediaToggle({
  source,
  enabledIcon: EnabledIcon,
  disabledIcon: DisabledIcon,
  labelOn,
  labelOff,
}: {
  source: Track.Source;
  enabledIcon: LucideIcon;
  disabledIcon: LucideIcon;
  labelOn: string;
  labelOff: string;
}) {
  const { buttonProps, enabled } = useTrackToggle({ source });
  const Icon = enabled ? EnabledIcon : DisabledIcon;

  const label = enabled ? labelOn : labelOff;

  return (
    <HoverCaption label={label}>
      <button
        type="button"
        aria-pressed={buttonProps['aria-pressed']}
        aria-label={label}
        disabled={buttonProps.disabled}
        onClick={buttonProps.onClick}
        className={cn(CALL_ICON_BUTTON_CLASS, enabled ? CALL_MEDIA_ON_CLASS : CALL_MEDIA_OFF_CLASS)}
      >
        <Icon aria-hidden />
      </button>
    </HoverCaption>
  );
}

function HoverCaption({ label, children }: { label: string; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger delay={200} render={children} />
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

function CallHangupButton({
  canEnd,
  ending,
  onHangUp,
}: {
  canEnd: boolean;
  ending: boolean;
  onHangUp: () => void;
}) {
  const t = useTranslations('videoMeetings.room');

  const label = canEnd ? t('endCall') : t('leave');

  return (
    <HoverCaption label={label}>
      <button
        type="button"
        className={cn(CALL_HANGUP_BUTTON_CLASS, 'ml-1')}
        aria-label={label}
        disabled={ending}
        onClick={onHangUp}
      >
        <Phone className="rotate-[135deg]" aria-hidden />
      </button>
    </HoverCaption>
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
  onArmLeave,
  onLeave,
  onAbortLeave,
  onEnd,
}: VideoMeetingMiniBarProps) {
  const t = useTranslations('videoMeetings.room');
  const { ending, hangUp } = useRoomExitActions({
    canEnd,
    onArmLeave,
    onLeave,
    onAbortLeave,
    onEnd,
  });

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

function useRoomExitActions({ canEnd, onArmLeave, onLeave, onAbortLeave, onEnd }: RoomExitProps) {
  const room = useRoomContext();
  const [ending, setEnding] = useState(false);

  const hangUp = async () => {
    setEnding(true);
    onArmLeave();
    try {
      await room.disconnect(true);
      if (canEnd) await onEnd();
      onLeave();
    } catch {
      onAbortLeave();
      setEnding(false);
    }
  };

  return { ending, hangUp };
}
