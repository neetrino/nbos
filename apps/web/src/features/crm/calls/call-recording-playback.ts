import {
  CALL_PLAYBACK_SPEEDS,
  CALL_RECORDING_PLAY_EVENT,
  DEFAULT_CALL_PLAYBACK_SPEED,
} from './call-recording-player.constants';

export function notifyCallRecordingPlay(callId: string): void {
  window.dispatchEvent(new CustomEvent(CALL_RECORDING_PLAY_EVENT, { detail: callId }));
}

export function nextCallPlaybackSpeed(current: number): number {
  const index = CALL_PLAYBACK_SPEEDS.findIndex((speed) => speed === current);
  const nextIndex = index < 0 ? 0 : (index + 1) % CALL_PLAYBACK_SPEEDS.length;
  return CALL_PLAYBACK_SPEEDS[nextIndex] ?? DEFAULT_CALL_PLAYBACK_SPEED;
}

export function formatPlaybackSpeedLabel(speed: number): string {
  return `${speed.toFixed(1)}x`;
}
