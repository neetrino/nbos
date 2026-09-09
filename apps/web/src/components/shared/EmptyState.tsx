'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="nbos-state-frame">
      <p className="nbos-desk-kicker">Empty ledger</p>
      <div className="bg-primary/10 text-primary mx-auto mt-5 flex size-14 items-center justify-center rounded-2xl">
        <Icon size={26} aria-hidden />
      </div>
      <h3 className="nbos-display text-foreground mt-5 text-3xl">{title}</h3>
      {description ? (
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
