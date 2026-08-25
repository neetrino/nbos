'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { readAudioDuration } from './call-activity-status';
import { nextCallPlaybackSpeed, notifyCallRecordingPlay } from './call-recording-playback';
import {
  CALL_RECORDING_PLAY_EVENT,
  DEFAULT_CALL_PLAYBACK_SPEED,
} from './call-recording-player.constants';

export function useCallRecordingPlayer(callId: string, durationHint: number | null) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [durationSec, setDurationSec] = useState(durationHint ?? 0);
  const [speed, setSpeed] = useState(DEFAULT_CALL_PLAYBACK_SPEED);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribePeerPause(callId, audioRef, setPlaying), [callId]);

  const syncDuration = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setDurationSec(readAudioDuration(audio.duration, durationHint ?? 0));
  }, [durationHint]);

  const onTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentSec(audio.currentTime);
    syncDuration();
  }, [syncDuration]);

  const onEnded = useCallback(() => {
    setPlaying(false);
    setCurrentSec(audioRef.current?.duration ?? durationHint ?? 0);
  }, [durationHint]);

  const onError = useCallback(() => {
    setPlaying(false);
    setError('Could not play recording');
  }, []);

  return {
    audioRef,
    playing,
    currentSec,
    durationSec,
    speed,
    error,
    onTimeUpdate,
    onEnded,
    onError,
    togglePlay: () =>
      void togglePlayback({ audioRef, callId, playing, speed, setPlaying, setError }),
    seekTo: (seconds: number) => seekPlayback(audioRef.current, seconds, setCurrentSec),
    cycleSpeed: () => cyclePlaybackSpeed(audioRef.current, speed, setSpeed),
  };
}

function subscribePeerPause(
  callId: string,
  audioRef: RefObject<HTMLAudioElement | null>,
  setPlaying: (playing: boolean) => void,
): () => void {
  const onPeerPlay = (event: Event) => {
    const peerId = (event as CustomEvent<string>).detail;
    if (peerId === callId) return;
    audioRef.current?.pause();
    setPlaying(false);
  };
  window.addEventListener(CALL_RECORDING_PLAY_EVENT, onPeerPlay);
  return () => window.removeEventListener(CALL_RECORDING_PLAY_EVENT, onPeerPlay);
}

async function togglePlayback(params: {
  audioRef: RefObject<HTMLAudioElement | null>;
  callId: string;
  playing: boolean;
  speed: number;
  setPlaying: (playing: boolean) => void;
  setError: (message: string | null) => void;
}): Promise<void> {
  const audio = params.audioRef.current;
  if (!audio) return;
  if (params.playing) {
    audio.pause();
    params.setPlaying(false);
    return;
  }
  notifyCallRecordingPlay(params.callId);
  audio.playbackRate = params.speed;
  try {
    await audio.play();
    params.setPlaying(true);
    params.setError(null);
  } catch {
    params.setPlaying(false);
    params.setError('Could not play recording');
  }
}

function seekPlayback(
  audio: HTMLAudioElement | null,
  seconds: number,
  setCurrentSec: (seconds: number) => void,
): void {
  if (!audio || !Number.isFinite(seconds)) return;
  audio.currentTime = seconds;
  setCurrentSec(seconds);
}

function cyclePlaybackSpeed(
  audio: HTMLAudioElement | null,
  speed: number,
  setSpeed: (speed: number) => void,
): void {
  const next = nextCallPlaybackSpeed(speed);
  if (audio) audio.playbackRate = next;
  setSpeed(next);
}
