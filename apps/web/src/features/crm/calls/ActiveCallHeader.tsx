'use client';

import { Phone, PhoneIncoming, PhoneOutgoing, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ACTIVE_CALL_PHASE_BADGE_CLASS } from './active-call.constants';
import { activeCallHeroInitials, shouldShowHeroPhone } from './active-call-hero';
import { activeCallDirectionLabel, activeCallPhaseLabel } from './active-call-labels';
import type { ActiveCallSession } from './active-call-session';
import type { ActiveCallPhase } from './active-call.types';

export function ActiveCallHeader(props: {
  session: ActiveCallSession;
  displayName: string;
  onClose: () => void;
}) {
  const { session, displayName, onClose } = props;
  return (
    <header className="relative mb-4">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-0 right-0"
        aria-label="Close call screen"
        onClick={onClose}
      >
        <X />
      </Button>
      <div className="flex flex-col items-center px-8 pt-3 text-center">
        <HeroAvatar title={displayName} direction={session.direction} phase={session.phase} />
        <HeroStatus direction={session.direction} phase={session.phase} />
        <h1 className="text-foreground mt-2.5 max-w-full text-2xl font-semibold tracking-tight sm:text-3xl">
          {displayName}
        </h1>
        {shouldShowHeroPhone(session.phone, displayName) ? (
          <p className="text-muted-foreground mt-1 text-sm tabular-nums">{session.phone}</p>
        ) : null}
      </div>
    </header>
  );
}

function HeroAvatar(props: {
  title: string;
  direction: ActiveCallSession['direction'];
  phase: ActiveCallPhase;
}) {
  const initials = activeCallHeroInitials(props.title);
  const DirectionIcon = props.direction === 'OUTBOUND' ? PhoneOutgoing : PhoneIncoming;
  return (
    <div className="relative flex size-16 items-center justify-center">
      {props.phase === 'ringing' ? (
        <span className="bg-primary/30 absolute inset-0 animate-ping rounded-full" aria-hidden />
      ) : null}
      <Avatar className="border-border bg-muted relative size-16 border">
        <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
          {initials ?? <Phone className="size-6" aria-hidden />}
        </AvatarFallback>
      </Avatar>
      <span className="bg-card ring-border absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full ring-2">
        <DirectionIcon className="text-primary size-3" aria-hidden />
      </span>
    </div>
  );
}

function HeroStatus(props: { direction: ActiveCallSession['direction']; phase: ActiveCallPhase }) {
  return (
    <p
      role="status"
      className={cn(
        'mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        ACTIVE_CALL_PHASE_BADGE_CLASS[props.phase],
      )}
    >
      {props.phase === 'ringing' ? (
        <span className="nbos-animate-pulse-soft size-1.5 rounded-full bg-current" aria-hidden />
      ) : null}
      {activeCallDirectionLabel(props.direction)} · {activeCallPhaseLabel(props.phase)}
    </p>
  );
}
