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
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/5 rounded-2xl border border-dashed px-6 py-16 text-center"
    >
      <Icon size={44} className="text-destructive/70 mx-auto" />
      <h3 className="text-foreground mt-4 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">{description}</p>
      {onRetry && (
        <div className="mt-5">
          <Button variant="outline" onClick={onRetry}>
            <RefreshCcw size={16} />
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
