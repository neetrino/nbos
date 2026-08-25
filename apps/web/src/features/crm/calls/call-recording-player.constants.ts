export const DEFAULT_CALL_PLAYBACK_SPEED = 1;

export const CALL_PLAYBACK_SPEEDS = [1, 1.5, 2] as const;

export type CallPlaybackSpeed = (typeof CALL_PLAYBACK_SPEEDS)[number];

export const CALL_RECORDING_SEEK_STEP = 0.1;

export const CALL_RECORDING_PLAY_EVENT = 'nbos:call-recording-play';

export const CALL_RECORDING_PLAYER_CLASS =
  'border-border bg-muted/20 flex min-w-0 flex-wrap items-center gap-2 rounded-xl border px-2.5 py-2';

export const CALL_RECORDING_SEEKER_CLASS =
  'accent-primary h-1.5 min-w-0 flex-1 cursor-pointer align-middle';
