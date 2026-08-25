'use client';

import { Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { callRecordingSrc } from '@/lib/api/calls';
import { cn } from '@/lib/utils';
import { formatPlaybackSpeedLabel } from './call-recording-playback';
import {
  CALL_RECORDING_PLAYER_CLASS,
  CALL_RECORDING_SEEKER_CLASS,
  CALL_RECORDING_SEEK_STEP,
} from './call-recording-player.constants';
import { formatCallPlaybackClock } from './format-call-duration';
import { useCallRecordingPlayer } from './use-call-recording-player';

export function CallRecordingPlayer(props: {
  callId: string;
  durationSec?: number | null;
  preload?: 'none' | 'metadata';
}) {
  const { callId, durationSec, preload = 'none' } = props;
  const {
    audioRef,
    playing,
    currentSec,
    durationSec: resolvedDuration,
    speed,
    error,
    onTimeUpdate,
    onEnded,
    onError,
    togglePlay,
    seekTo,
    cycleSpeed,
  } = useCallRecordingPlayer(callId, durationSec ?? null);

  return (
    <div className={CALL_RECORDING_PLAYER_CLASS}>
      <audio
        ref={audioRef}
        src={callRecordingSrc(callId)}
        preload={preload}
        className="sr-only"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onTimeUpdate}
        onEnded={onEnded}
        onError={onError}
      >
        Play
      </audio>
      <RecordingPlayButton playing={playing} onToggle={togglePlay} />
      <RecordingClock seconds={currentSec} align="end" />
      <RecordingSeeker currentSec={currentSec} durationSec={resolvedDuration} onSeek={seekTo} />
      <RecordingClock seconds={resolvedDuration} align="start" />
      <RecordingSpeedButton speed={speed} onCycle={cycleSpeed} />
      {error ? <p className="text-destructive basis-full text-[11px]">{error}</p> : null}
    </div>
  );
}

function RecordingPlayButton(props: { playing: boolean; onToggle: () => void }) {
  return (
    <Button
      type="button"
      size="icon-xs"
      variant="default"
      className="rounded-full"
      aria-label={props.playing ? 'Pause recording' : 'Play recording'}
      onClick={props.onToggle}
    >
      {props.playing ? <Pause className="size-3" /> : <Play className="size-3" />}
    </Button>
  );
}

function RecordingClock(props: { seconds: number; align: 'start' | 'end' }) {
  return (
    <span
      className={cn(
        'text-muted-foreground w-9 shrink-0 text-[11px] tabular-nums',
        props.align === 'end' && 'text-right',
      )}
    >
      {formatCallPlaybackClock(props.seconds)}
    </span>
  );
}

function RecordingSeeker(props: {
  currentSec: number;
  durationSec: number;
  onSeek: (seconds: number) => void;
}) {
  const canSeek = props.durationSec > 0;
  return (
    <input
      type="range"
      min={0}
      max={canSeek ? props.durationSec : 1}
      step={CALL_RECORDING_SEEK_STEP}
      value={canSeek ? Math.min(props.currentSec, props.durationSec) : 0}
      disabled={!canSeek}
      aria-label="Recording progress"
      className={CALL_RECORDING_SEEKER_CLASS}
      onChange={(event) => props.onSeek(Number(event.target.value))}
    />
  );
}

function RecordingSpeedButton(props: { speed: number; onCycle: () => void }) {
  const label = formatPlaybackSpeedLabel(props.speed);
  return (
    <Button
      type="button"
      size="xs"
      variant="ghost"
      className="text-primary min-w-9 px-1.5 font-semibold"
      aria-label={`Playback speed ${label}`}
      onClick={props.onCycle}
    >
      {label}
    </Button>
  );
}
