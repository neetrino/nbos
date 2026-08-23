'use client';

import { useCallback, useEffect, useState } from 'react';
import { connectCallSse } from '@/lib/realtime/connect-call-sse';
import { callsApi, type ActiveCallScreenSnapshot } from '@/lib/api/calls';
import {
  applyActiveCallEvent,
  sessionFromCallId,
  type ActiveCallSession,
} from './active-call-session';

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
    void callsApi
      .getScreen(callId)
      .then((next) => {
        if (!cancelled) setSnapshot(next);
      })
      .catch(() => {
        if (!cancelled) setSnapshot(null);
      });
    return () => {
      cancelled = true;
    };
  }, [callId, phase]);

  const visibleSnapshot = snapshot && callId && snapshot.callId === callId ? snapshot : null;

  return { session, snapshot: visibleSnapshot, setSnapshot, openCall, close };
}
