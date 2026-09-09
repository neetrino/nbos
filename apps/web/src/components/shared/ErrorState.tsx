'use client';

import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  description: string;
  actionLabel?: string;
  icon?: LucideIcon;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  actionLabel = 'Try again',
  icon: Icon = AlertTriangle,
  onRetry,
}: ErrorStateProps) {
  return (
    <div role="alert" className="nbos-state-frame">
      <p className="nbos-desk-kicker">Needs attention</p>
      <div className="bg-destructive/10 text-destructive mx-auto mt-5 flex size-14 items-center justify-center rounded-2xl">
        <Icon size={26} aria-hidden />
      </div>
      <h3 className="nbos-display text-foreground mt-5 text-3xl">{title}</h3>
      <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-relaxed">
        {description}
      </p>
      {onRetry ? (
        <div className="mt-6">
          <Button variant="outline" onClick={onRetry}>
            <RefreshCcw size={16} />
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
