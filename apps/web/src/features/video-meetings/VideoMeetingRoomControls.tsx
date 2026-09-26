'use client';

import { Chat, TrackToggle, useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

type VideoMeetingRoomControlsProps = {
  canEnd: boolean;
  onLeave: () => void;
  onEnd: () => Promise<void>;
};

/** In-room controls. Leave exits this person. End call stops the meeting for everyone. */
export function VideoMeetingRoomControls({
  canEnd,
  onLeave,
  onEnd,
}: VideoMeetingRoomControlsProps) {
  const t = useTranslations('videoMeetings.room');
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="border-border/80 bg-background/95 shrink-0 space-y-2 border-t px-3 py-3 backdrop-blur">
      <div
        className="flex flex-wrap items-center justify-between gap-3"
        role="toolbar"
        aria-label={t('controlsAria')}
      >
        <RoomMediaButtons
          mic={t('mic')}
          camera={t('camera')}
          shareScreen={t('shareScreen')}
          chat={t('chat')}
          onChat={() => setChatOpen((open) => !open)}
        />
        <RoomExitButtons
          canEnd={canEnd}
          leaveLabel={t('leave')}
          endLabel={t('endCall')}
          onLeave={onLeave}
          onEnd={onEnd}
        />
      </div>
      {chatOpen ? (
        <div className="border-border max-h-56 overflow-hidden rounded-lg border">
          <Chat />
        </div>
      ) : null}
    </div>
  );
}

const mediaButtonClass =
  'border-border bg-muted/40 inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm';

function RoomMediaButtons({
  mic,
  camera,
  shareScreen,
  chat,
  onChat,
}: {
  mic: string;
  camera: string;
  shareScreen: string;
  chat: string;
  onChat: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <TrackToggle source={Track.Source.Microphone} className={mediaButtonClass}>
        {mic}
      </TrackToggle>
      <TrackToggle source={Track.Source.Camera} className={mediaButtonClass}>
        {camera}
      </TrackToggle>
      <TrackToggle source={Track.Source.ScreenShare} className={mediaButtonClass}>
        {shareScreen}
      </TrackToggle>
      <button type="button" className={mediaButtonClass} onClick={onChat}>
        {chat}
      </button>
    </div>
  );
}

function RoomExitButtons({
  canEnd,
  leaveLabel,
  endLabel,
  onLeave,
  onEnd,
}: {
  canEnd: boolean;
  leaveLabel: string;
  endLabel: string;
  onLeave: () => void;
  onEnd: () => Promise<void>;
}) {
  const room = useRoomContext();
  const [ending, setEnding] = useState(false);

  const leave = () => {
    onLeave();
    void room.disconnect(true);
  };

  const endCall = async () => {
    setEnding(true);
    try {
      await onEnd();
      leave();
    } catch {
      setEnding(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" disabled={ending} onClick={leave}>
        {leaveLabel}
      </Button>
      {canEnd ? (
        <Button
          type="button"
          size="form"
          variant="destructive"
          className="bg-destructive hover:bg-destructive/90 text-white"
          disabled={ending}
          onClick={() => void endCall()}
        >
          {endLabel}
        </Button>
      ) : null}
    </div>
  );
}
