'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportTabStateProps {
  loading: boolean;
  error: string | null;
  loadedAt: Date | null;
  refresh: () => void;
}

export function ReportTabState({ loading, error, loadedAt, refresh }: ReportTabStateProps) {
  if (loading) {
    return (
      <div className="border-border bg-card rounded-2xl border p-8 text-center">
        <RefreshCw className="text-muted-foreground mx-auto h-7 w-7 animate-spin" />
        <p className="mt-3 font-medium">Loading report data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-destructive/30 bg-card rounded-2xl border p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-destructive mt-0.5 h-5 w-5" />
          <div>
            <p className="font-medium">Report data unavailable</p>
            <p className="text-muted-foreground mt-1 text-sm">{error}</p>
            <Button type="button" className="mt-4" variant="outline" onClick={refresh}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!loadedAt) return null;

  return (
    <p className="text-muted-foreground text-xs">
      Loaded at {loadedAt.toLocaleTimeString()} · data refreshes per active tab.
    </p>
  );
}
