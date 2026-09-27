'use client';

import {
  isTrackReference,
  useRoomContext,
  useTracks,
  VideoTrack,
  type TrackReference,
  type TrackReferenceOrPlaceholder,
} from '@livekit/components-react';
import { RoomEvent, Track, type Participant } from 'livekit-client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { cn } from '@/lib/utils';

export type CallSelfPresence = {
  name: string;
  avatarUrl?: string;
};

const STAGE_CLASS =
  'relative min-h-0 flex-1 overflow-hidden bg-gradient-to-b from-primary/20 via-background to-muted/40';

type Presence = { label: string; imageUrl?: string };

/** Camera-off stage uses the caller's photo instead of the stock gray silhouette. */
export function VideoMeetingStage({ self }: { self: CallSelfPresence }) {
  const cameras = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], {
    onlySubscribed: false,
  });
  const screens = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }], {
    onlySubscribed: false,
  });
  const tiles = [...screens, ...cameras];
  const solo = tiles.length === 1 ? tiles[0] : undefined;

  return (
    <div className={STAGE_CLASS}>
      {solo && !hasLiveVideo(solo) ? (
        <VideoMeetingPortrait track={solo} self={self} />
      ) : (
        <ul className={gridClass(tiles.length)}>
          {tiles.map((track) => (
            <VideoMeetingTile key={tileKey(track)} track={track} self={self} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Shown when the browser refuses the camera or microphone. */
export function VideoMeetingDeviceNotice() {
  const room = useRoomContext();
  const t = useTranslations('videoMeetings.room');
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const onError = () => setBlocked(true);
    room.on(RoomEvent.MediaDevicesError, onError);
    return () => {
      room.off(RoomEvent.MediaDevicesError, onError);
    };
  }, [room]);

  if (!blocked) return null;

  return (
    <p className="bg-background/95 text-foreground absolute top-4 left-1/2 z-20 max-w-md -translate-x-1/2 rounded-full px-4 py-2 text-center text-xs shadow-lg">
      {t('mediaBlocked')}
    </p>
  );
}

function VideoMeetingPortrait({
  track,
  self,
}: {
  track: TrackReferenceOrPlaceholder;
  self: CallSelfPresence;
}) {
  const presence = presenceFor(track.participant, self);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-6">
      <div className="ring-border rounded-full p-1 shadow-2xl ring-1">
        <EmployeePersonAvatar
          label={presence.label}
          imageUrl={presence.imageUrl}
          loading="eager"
          className="size-40 text-4xl"
        />
      </div>
      <p className="text-lg font-semibold tracking-tight">{presence.label}</p>
    </div>
  );
}

function VideoMeetingTile({
  track,
  self,
}: {
  track: TrackReferenceOrPlaceholder;
  self: CallSelfPresence;
}) {
  const presence = presenceFor(track.participant, self);
  const sharing = track.source === Track.Source.ScreenShare;

  return (
    <li className="flex min-h-0 min-w-0 flex-col">
      <div className="bg-card/50 ring-border relative min-h-0 flex-1 overflow-hidden rounded-3xl ring-1">
        {hasLiveVideo(track) ? (
          <VideoTrack
            trackRef={track}
            className={cn('h-full w-full', sharing ? 'object-contain' : 'object-cover')}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmployeePersonAvatar
              label={presence.label}
              imageUrl={presence.imageUrl}
              loading="eager"
              className="size-24 text-2xl"
            />
          </div>
        )}
      </div>
      <p className="mt-2 truncate text-center text-sm font-medium">{presence.label}</p>
    </li>
  );
}

function presenceFor(participant: Participant, self: CallSelfPresence): Presence {
  if (participant.isLocal) return { label: self.name, imageUrl: self.avatarUrl };
  return { label: participant.name || participant.identity };
}

function hasLiveVideo(track: TrackReferenceOrPlaceholder): track is TrackReference {
  return isTrackReference(track) && !track.publication.isMuted && Boolean(track.publication.track);
}

function tileKey(track: TrackReferenceOrPlaceholder): string {
  return `${track.participant.identity}-${track.source}`;
}

function gridClass(count: number): string {
  if (count <= 1) return 'flex h-full items-center justify-center p-6';
  if (count <= 4) return 'grid h-full grid-cols-2 content-center gap-4 p-4';
  return 'grid h-full grid-cols-3 content-center gap-3 p-4';
}
