'use client';

import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import type { VideoMeetingThreadRecordingPerson } from '@/lib/api/video-meetings-thread';
import { formatRecordingElapsed } from './video-meeting-recording-elapsed';

type VideoMeetingRecordingPreviewProps = {
  people: VideoMeetingThreadRecordingPerson[];
  durationSeconds: number | null;
  statusLabel: string;
  url: string | null;
  playable: boolean;
  onOpen: () => void;
};

/** Call-style cover: faces and names, play control with the length beside it. */
export function VideoMeetingRecordingPreview({
  people,
  durationSeconds,
  statusLabel,
  url,
  playable,
  onOpen,
}: VideoMeetingRecordingPreviewProps) {
  const t = useTranslations('videoMeetings.recording');
  const duration = durationSeconds === null ? null : formatRecordingElapsed(durationSeconds);

  return (
    <div className="from-primary/20 via-background to-muted/40 relative flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-b px-4">
      <span className="bg-background/80 text-foreground absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
        {statusLabel}
      </span>
      <CoverPeople people={people} />
      {playable ? (
        <button
          type="button"
          className="flex items-center gap-3 disabled:opacity-50"
          aria-label={duration ? t('previewAria', { time: duration }) : t('openRecording')}
          disabled={!url}
          onClick={onOpen}
        >
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-white text-neutral-950 shadow-lg ring-1 ring-white/40">
            <Play className="ml-0.5 size-5 fill-current" aria-hidden />
          </span>
          {duration ? <span className="text-sm font-semibold tabular-nums">{duration}</span> : null}
        </button>
      ) : null}
    </div>
  );
}

function CoverPeople({ people }: { people: VideoMeetingThreadRecordingPerson[] }) {
  if (people.length === 0) return null;
  if (people.length === 1) return <SoloPerson person={people[0]!} />;
  return (
    <ul className="flex max-w-full flex-wrap items-end justify-center gap-3">
      {people.map((person) => (
        <li key={person.id} className="flex w-16 flex-col items-center gap-1">
          <EmployeePersonAvatar
            label={person.displayName}
            imageUrl={person.avatarUrl}
            loading="eager"
            className="size-12 text-sm"
          />
          <span className="w-full truncate text-center text-xs font-medium">
            {person.displayName}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SoloPerson({ person }: { person: VideoMeetingThreadRecordingPerson }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="ring-border rounded-full p-0.5 shadow-lg ring-1">
        <EmployeePersonAvatar
          label={person.displayName}
          imageUrl={person.avatarUrl}
          loading="eager"
          className="size-16 text-xl"
        />
      </div>
      <p className="max-w-full truncate text-sm font-semibold tracking-tight">
        {person.displayName}
      </p>
    </div>
  );
}
