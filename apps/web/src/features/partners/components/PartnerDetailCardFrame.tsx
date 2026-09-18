'use client';

import type { ReactNode } from 'react';
import { DataView, ListMutationErrorBanner } from '@/components/shared';
import { Button } from '@/components/ui/button';

export function PartnerDetailCardFrame({
  loading,
  error,
  hasData,
  loadingLabel,
  onRetry,
  onDismissError,
  children,
}: {
  loading: boolean;
  error: string | null;
  hasData: boolean;
  loadingLabel: string;
  onRetry: () => void;
  onDismissError: () => void;
  children: ReactNode;
}) {
  return (
    <DataView
      loading={loading}
      error={error}
      hasData={hasData}
      loadingFallback={
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-sm">{loadingLabel}</p>
        </div>
      }
      errorFallback={
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-destructive text-sm" role="alert">
            {error ?? 'Could not load.'}
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            Retry
          </Button>
        </div>
      }
    >
      {error ? <ListMutationErrorBanner message={error} onDismiss={onDismissError} /> : null}
      {children}
    </DataView>
  );
}
