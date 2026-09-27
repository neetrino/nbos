'use client';

import { DURATION_GUARD_CENTER_LEAD_MS, type DurationGuardPhase } from '@nbos/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  continueDurationGuard,
  expireDurationGuard,
  getDurationGuard,
} from '@/lib/api/video-meetings-duration-guard';
import { RECORDING_ELAPSED_TICK_MS } from './video-meeting-recording-elapsed';

const DURATION_GUARD_POLL_MS = 5000;

export type DurationGuardView = {
  phase: DurationGuardPhase;
  remainingMs: number;
  centered: boolean;
  continueMeeting: () => Promise<void>;
  busy: boolean;
  failed: boolean;
};

type GuardAnchor = {
  phase: DurationGuardPhase;
  checkpointAt: string | null;
  remainingMs: number;
  syncedAt: number;
};

export function useDurationGuard(meetingId: string): DurationGuardView {
  const [anchor, setAnchor] = useState<GuardAnchor | null>(null);
  const [tick, setTick] = useState(() => performance.now());
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const expireOnceRef = useRef<string | null>(null);
  const refresh = useGuardRefresh(meetingId, setAnchor);

  useEffect(() => {
    const id = setInterval(() => setTick(performance.now()), RECORDING_ELAPSED_TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), DURATION_GUARD_POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const phase = anchor?.phase ?? 'quiet';
  const checkpointAt = anchor?.checkpointAt ?? null;
  const remainingMs = remainingFromAnchor(anchor, tick);
  useExpireAtZero(meetingId, phase, checkpointAt, remainingMs, expireOnceRef);
  const continueMeeting = useContinueGuard(meetingId, setAnchor, setBusy, setFailed, expireOnceRef);

  return {
    phase,
    remainingMs,
    centered:
      phase === 'warning' && remainingMs <= DURATION_GUARD_CENTER_LEAD_MS && remainingMs > 0,
    continueMeeting,
    busy,
    failed,
  };
}

function useGuardRefresh(meetingId: string, setAnchor: (anchor: GuardAnchor) => void) {
  return useCallback(async () => {
    try {
      setAnchor(anchorFrom(await getDurationGuard(meetingId)));
    } catch {
      // Keep the last phase so a brief API failure does not hide the warning.
    }
  }, [meetingId, setAnchor]);
}

function useContinueGuard(
  meetingId: string,
  setAnchor: (anchor: GuardAnchor) => void,
  setBusy: (busy: boolean) => void,
  setFailed: (failed: boolean) => void,
  expireOnceRef: { current: string | null },
) {
  return useCallback(async () => {
    setBusy(true);
    setFailed(false);
    try {
      setAnchor(anchorFrom(await continueDurationGuard(meetingId)));
      expireOnceRef.current = null;
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, [expireOnceRef, meetingId, setAnchor, setBusy, setFailed]);
}

function useExpireAtZero(
  meetingId: string,
  phase: DurationGuardPhase,
  checkpointAt: string | null,
  remainingMs: number,
  expireOnceRef: { current: string | null },
) {
  useEffect(() => {
    if (phase === 'quiet' || !checkpointAt || remainingMs > 0) return;
    if (expireOnceRef.current === checkpointAt) return;
    expireOnceRef.current = checkpointAt;
    void expireDurationGuard(meetingId).catch(() => {
      expireOnceRef.current = null;
    });
  }, [checkpointAt, expireOnceRef, meetingId, phase, remainingMs]);
}

function anchorFrom(state: {
  phase: DurationGuardPhase;
  checkpointAt: string | null;
  remainingMs: number;
}): GuardAnchor {
  return { ...state, syncedAt: performance.now() };
}

function remainingFromAnchor(anchor: GuardAnchor | null, tick: number): number {
  if (!anchor) return 0;
  return Math.max(0, anchor.remainingMs - (tick - anchor.syncedAt));
}
