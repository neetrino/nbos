'use client';

import type { ActiveCallScreenSnapshot } from '@/lib/api/calls';
import { ACTIVE_CALL_SCREEN_Z_CLASS } from './active-call.constants';
import { ActiveCallContextGrid } from './ActiveCallContextGrid';
import { ActiveCallEndedSection } from './ActiveCallEndedSection';
import { ActiveCallEntityLinks } from './ActiveCallEntityLinks';
import { ActiveCallHeader } from './ActiveCallHeader';
import type { ActiveCallSession } from './active-call-session';

export function ActiveCallScreen(props: {
  session: ActiveCallSession | null;
  snapshot: ActiveCallScreenSnapshot | null;
  onSnapshot?: (next: ActiveCallScreenSnapshot) => void;
  onClose: () => void;
}) {
  const { session, snapshot, onSnapshot, onClose } = props;
  if (!session) return null;

  const displayName =
    snapshot?.displayName ??
    session.displayName ??
    (session.direction === 'INBOUND'
      ? `Incoming call ${session.phone ?? ''}`.trim()
      : (session.phone ?? 'Call'));
  const phase = snapshot?.phase ?? session.phase;

  return (
    <div
      className={`bg-background fixed inset-0 ${ACTIVE_CALL_SCREEN_Z_CLASS} overflow-y-auto`}
      role="dialog"
      aria-modal="true"
      aria-label="Active call"
    >
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 p-6 md:p-10">
        <ActiveCallHeader session={session} displayName={displayName} onClose={onClose} />
        <ActiveCallContextGrid snapshot={snapshot} />
        {phase === 'ended' && snapshot ? (
          <ActiveCallEndedSection snapshot={snapshot} onSnapshot={onSnapshot ?? noop} />
        ) : null}
        <ActiveCallEntityLinks snapshot={snapshot} />
      </div>
    </div>
  );
}

function noop(): void {
  /* snapshot updates are optional when the parent does not lift state */
}
