'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePermission } from '@/lib/permissions';
import { connectCallSse } from '@/lib/realtime/connect-call-sse';
import { IncomingCallModal } from './IncomingCallModal';
import type { IncomingCallPayload } from './incoming-call.types';

/**
 * App-shell incoming-call listener. Live SSE only — refresh does not restore a popup.
 */
export function IncomingCallProvider({ children }: { children: ReactNode }) {
  const { me } = usePermission();
  const employeeId = me?.id;

  return (
    <>
      {children}
      {employeeId ? <IncomingCallBridge key={employeeId} /> : null}
    </>
  );
}

function IncomingCallBridge() {
  const [call, setCall] = useState<IncomingCallPayload | null>(null);

  useEffect(() => {
    const session = connectCallSse({
      onIncomingCall: (payload) => {
        setCall(payload);
      },
    });
    return () => {
      session.close();
    };
  }, []);

  return <IncomingCallModal call={call} onClose={() => setCall(null)} />;
}
