'use client';

import { useEffect, useRef } from 'react';
import type { ActiveCallScreenSnapshot } from '@/lib/api/calls';
import { cn } from '@/lib/utils';
import {
  ACTIVE_CALL_OVERLAY_CLASS,
  ACTIVE_CALL_PANEL_CLASS,
  ACTIVE_CALL_SCREEN_Z_CLASS,
  ACTIVE_CALL_SHELL_CLASS,
} from './active-call.constants';
import { activeCallHeroTitle } from './active-call-hero';
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

  return (
    <ActiveCallScreenBody
      session={session}
      snapshot={snapshot}
      onSnapshot={onSnapshot}
      onClose={onClose}
    />
  );
}

function ActiveCallScreenBody(props: {
  session: ActiveCallSession;
  snapshot: ActiveCallScreenSnapshot | null;
  onSnapshot?: (next: ActiveCallScreenSnapshot) => void;
  onClose: () => void;
}) {
  const { session, snapshot, onSnapshot, onClose } = props;
  const panelRef = useActiveCallPanel(onClose);
  const displayName = resolveDisplayName(session, snapshot);
  const phase = snapshot?.phase ?? session.phase;

  return (
    <div className={cn(ACTIVE_CALL_SHELL_CLASS, ACTIVE_CALL_SCREEN_Z_CLASS)}>
      <div className={ACTIVE_CALL_OVERLAY_CLASS} aria-hidden />
      <div
        ref={panelRef}
        className={cn(ACTIVE_CALL_PANEL_CLASS, 'animate-in fade-in-0 zoom-in-95 duration-150')}
        role="dialog"
        aria-modal="true"
        aria-label="Active call"
        tabIndex={-1}
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <ActiveCallHeader session={session} displayName={displayName} onClose={onClose} />
          <ActiveCallContextGrid snapshot={snapshot} />
          {phase === 'ended' && snapshot ? (
            <ActiveCallEndedSection snapshot={snapshot} onSnapshot={onSnapshot ?? noop} />
          ) : null}
        </div>
        <ActiveCallEntityLinks snapshot={snapshot} />
      </div>
    </div>
  );
}

function resolveDisplayName(
  session: ActiveCallSession,
  snapshot: ActiveCallScreenSnapshot | null,
): string {
  const fallback =
    session.direction === 'INBOUND'
      ? `Incoming call ${session.phone ?? ''}`.trim()
      : (session.phone ?? 'Call');
  const raw = snapshot?.displayName ?? session.displayName ?? fallback;
  return activeCallHeroTitle(snapshot?.contact.name ?? null, raw);
}

function useActiveCallPanel(onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return panelRef;
}

function noop(): void {
  /* snapshot updates are optional when the parent does not lift state */
}
