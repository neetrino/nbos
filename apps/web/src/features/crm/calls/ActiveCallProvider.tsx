'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { usePermission } from '@/lib/permissions';
import { ActiveCallScreen } from './ActiveCallScreen';
import { sessionFromCallId } from './active-call-session';
import { useActiveCallController } from './use-active-call-controller';

type OpenCallInput = Parameters<typeof sessionFromCallId>[0];

type ActiveCallApi = {
  openCall: (input: OpenCallInput) => void;
  close: () => void;
};

const ActiveCallContext = createContext<ActiveCallApi>({
  openCall: () => undefined,
  close: () => undefined,
});

export function useActiveCall(): ActiveCallApi {
  return useContext(ActiveCallContext);
}

export function ActiveCallProvider({ children }: { children: ReactNode }) {
  const { me } = usePermission();
  const employeeId = me?.id;
  const { session, snapshot, setSnapshot, openCall, close } = useActiveCallController(
    Boolean(employeeId),
  );

  return (
    <ActiveCallContext.Provider value={{ openCall, close }}>
      {children}
      <ActiveCallScreen
        session={session}
        snapshot={snapshot}
        onSnapshot={setSnapshot}
        onClose={close}
      />
    </ActiveCallContext.Provider>
  );
}
