'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { applyPresenceDelta, type MessengerPresenceState } from './messenger-presence-payload';

export function useMessengerOnlineIds() {
  const [onlineIds, setOnlineIds] = useState<ReadonlySet<string>>(() => new Set());
  const onPresenceSnapshotRef = useRef<(employeeIds: readonly string[]) => void>(() => undefined);
  const onPresenceDeltaRef = useRef<(employeeId: string, state: MessengerPresenceState) => void>(
    () => undefined,
  );

  useLayoutEffect(() => {
    onPresenceSnapshotRef.current = (employeeIds) => {
      setOnlineIds(new Set(employeeIds));
    };
    onPresenceDeltaRef.current = (employeeId, state) => {
      setOnlineIds((current) => applyPresenceDelta(current, employeeId, state));
    };
  });

  return { onlineIds, onPresenceSnapshotRef, onPresenceDeltaRef };
}
