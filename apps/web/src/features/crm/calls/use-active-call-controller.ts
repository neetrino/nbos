'use client';

import { useCallback, useEffect, useState } from 'react';
import { connectCallSse } from '@/lib/realtime/connect-call-sse';
import { callsApi, type ActiveCallScreenSnapshot } from '@/lib/api/calls';
import {
  applyActiveCallEvent,
  applySnapshotToSession,
  sessionFromCallId,
  type ActiveCallSession,
} from './active-call-session';
import { ACTIVE_CALL_SCREEN_POLL_MS } from './active-call.constants';

type OpenCallInput = Parameters<typeof sessionFromCallId>[0];

export function useActiveCallController(enabled: boolean) {
  const [session, setSession] = useState<ActiveCallSession | null>(null);
  const [snapshot, setSnapshot] = useState<ActiveCallScreenSnapshot | null>(null);
  const callId = session?.callId;
  const phase = session?.phase;

  const close = useCallback(() => {
    setSession(null);
    setSnapshot(null);
  }, []);

  const openCall = useCallback((input: OpenCallInput) => {
    setSnapshot(null);
    setSession(sessionFromCallId(input));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const live = connectCallSse({
      onCallEvent: (event) => {
        setSession((current) => applyActiveCallEvent(current, event));
      },
    });
    return () => live.close();
  }, [enabled]);

  useEffect(() => {
    if (!callId) return;
    let cancelled = false;

    const load = () => {
      void callsApi
        .getScreen(callId)
        .then((next) => {
          if (cancelled) return;
          setSnapshot(next);
          setSession((current) => applySnapshotToSession(current, next));
        })
        .catch(() => undefined);
    };

    load();
    if (phase === 'ended') {
      return () => {
        cancelled = true;
      };
    }
    const timer = window.setInterval(load, ACTIVE_CALL_SCREEN_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [callId, phase]);

  const visibleSnapshot = snapshot && callId && snapshot.callId === callId ? snapshot : null;

  return { session, snapshot: visibleSnapshot, setSnapshot, openCall, close };
}
