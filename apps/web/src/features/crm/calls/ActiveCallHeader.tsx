'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { activeCallDirectionLabel, activeCallPhaseLabel } from './active-call-labels';
import type { ActiveCallSession } from './active-call-session';

export function ActiveCallHeader(props: {
  session: ActiveCallSession;
  displayName: string;
  onClose: () => void;
}) {
  const { session, displayName, onClose } = props;
  return (
    <header className="border-border flex items-start justify-between gap-4 border-b pb-4">
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {activeCallDirectionLabel(session.direction)} · {activeCallPhaseLabel(session.phase)}
        </p>
        <h1 className="text-foreground mt-1 truncate text-xl font-semibold">{displayName}</h1>
        {session.phone ? (
          <p className="text-muted-foreground mt-1 text-sm">{session.phone}</p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Close call screen"
        onClick={onClose}
      >
        <X className="size-5" />
      </Button>
    </header>
  );
}
