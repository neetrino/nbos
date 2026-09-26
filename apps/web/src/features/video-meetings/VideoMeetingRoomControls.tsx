'use client';

import { Chat, DisconnectButton, TrackToggle } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

/** Custom control bar with localized labels so LiveKit chrome is not clipped English text. */
export function VideoMeetingRoomControls() {
  const t = useTranslations('videoMeetings.room');
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="border-border/80 bg-background/95 shrink-0 space-y-2 border-t px-3 py-3 backdrop-blur">
      <div
        className="flex flex-wrap items-center justify-center gap-2"
        role="toolbar"
        aria-label={t('controlsAria')}
      >
        <TrackToggle
          source={Track.Source.Microphone}
          className="border-border bg-muted/40 inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm"
        >
          {t('mic')}
        </TrackToggle>
        <TrackToggle
          source={Track.Source.Camera}
          className="border-border bg-muted/40 inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm"
        >
          {t('camera')}
        </TrackToggle>
        <TrackToggle
          source={Track.Source.ScreenShare}
          className="border-border bg-muted/40 inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm"
        >
          {t('shareScreen')}
        </TrackToggle>
        <button
          type="button"
          className="border-border bg-muted/40 inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm"
          onClick={() => setChatOpen((open) => !open)}
        >
          {t('chat')}
        </button>
        <DisconnectButton className="bg-destructive text-destructive-foreground inline-flex h-10 items-center rounded-lg px-3 text-sm">
          {t('leave')}
        </DisconnectButton>
      </div>
      {chatOpen ? (
        <div className="border-border max-h-56 overflow-hidden rounded-lg border">
          <Chat />
        </div>
      ) : null}
    </div>
  );
}
