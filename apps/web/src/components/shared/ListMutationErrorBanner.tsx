'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ListMutationErrorBannerProps {
  message: string;
  onDismiss: () => void;
  dismissAriaLabel?: string;
}

/**
 * Inline dismissible alert for non-fatal list mutations (e.g. refresh failed after a successful write).
 */
export function ListMutationErrorBanner({
  message,
  onDismiss,
  dismissAriaLabel = 'Dismiss error',
}: ListMutationErrorBannerProps) {
  return (
    <div
      className="border-destructive/40 bg-destructive/5 flex flex-wrap items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
      role="alert"
    >
      <p className="text-destructive max-w-prose">{message}</p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive shrink-0"
        onClick={onDismiss}
        aria-label={dismissAriaLabel}
      >
        <X size={16} />
      </Button>
    </div>
  );
}
