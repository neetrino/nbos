'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Eraser, ExternalLink, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  platformLifecycleApi,
  type PlatformTrashInventoryResponse,
} from '@/lib/api/platform-lifecycle';

function profileTone(profile: string): string {
  if (profile === 'A') return 'text-sky-600 dark:text-sky-400';
  if (profile === 'B') return 'text-violet-600 dark:text-violet-400';
  if (profile === 'C') return 'text-amber-600 dark:text-amber-400';
  return 'text-muted-foreground';
}

export function PlatformTrashInventoryPanel() {
  const [inventory, setInventory] = useState<PlatformTrashInventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await platformLifecycleApi.getTrashInventory();
      setInventory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load trash inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRunPurge = async () => {
    if (
      !window.confirm(
        'Run automated retention purge for Credentials and Drive?\n\nThis permanently deletes trashed rows past retention TTL. This cannot be undone.',
      )
    ) {
      return;
    }
    setPurging(true);
    try {
      const result = await platformLifecycleApi.runRetentionPurge();
      toast.success(
        `Purged ${result.totalPurged} row(s) — credentials: ${result.credentials.purged}, drive: ${result.driveFiles.purged}`,
      );
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Retention purge failed');
    } finally {
      setPurging(false);
    }
  };

  if (loading && !inventory) {
    return <LoadingState label="Loading trash inventory…" />;
  }

  if (error && !inventory) {
    return <ErrorState message={error} onRetry={() => void load()} />;
  }

  if (!inventory) {
    return null;
  }

  const generatedLabel = new Date(inventory.generatedAt).toLocaleString();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="neutral" label={`${inventory.totalTrashed} in Trash`} />
          {inventory.totalPurgeEligible > 0 ? (
            <StatusBadge tone="warning" label={`${inventory.totalPurgeEligible} past retention`} />
          ) : null}
          <span className="text-muted-foreground text-xs">Updated {generatedLabel}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {inventory.totalPurgeEligible > 0 ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={loading || purging}
              onClick={() => void handleRunPurge()}
            >
              <Eraser className={cn('mr-1.5 size-3.5', purging && 'animate-pulse')} aria-hidden />
              Run retention purge
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || purging}
            onClick={() => void load()}
          >
            <RefreshCw className={cn('mr-1.5 size-3.5', loading && 'animate-spin')} aria-hidden />
            Refresh
          </Button>
        </div>
      </div>

      {inventory.totalPurgeEligible > 0 ? (
        <p className="text-muted-foreground flex items-start gap-2 text-sm">
          <ShieldAlert className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
          Rows past retention are eligible for automated purge (Credentials + Drive). Profile A
          entities are inventory-only until purge jobs ship. Override TTL via
          PLATFORM_TRASH_RETENTION_DAYS_* env vars.
        </p>
      ) : null}

      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Module</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead className="text-right">In Trash</TableHead>
              <TableHead className="text-right">Purge eligible</TableHead>
              <TableHead>Retention</TableHead>
              <TableHead className="text-right">Open</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.categories.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="text-muted-foreground text-sm">{row.moduleLabel}</TableCell>
                <TableCell className="font-medium">{row.entityLabel}</TableCell>
                <TableCell>
                  <span className={cn('text-xs font-semibold', profileTone(row.profile))}>
                    {row.profile}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                <TableCell
                  className={cn(
                    'text-right tabular-nums',
                    row.purgeEligibleCount > 0 && 'text-destructive font-medium',
                  )}
                >
                  {row.purgeEligibleCount}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {row.retentionDays != null ? `${row.retentionDays} days` : 'Manual'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    render={(props) => (
                      <Link
                        {...props}
                        href={row.webHref}
                        className={cn(
                          props.className,
                          'inline-flex h-8 items-center gap-1 px-2 text-xs',
                        )}
                      >
                        <ExternalLink className="size-3.5" aria-hidden />
                        Module
                      </Link>
                    )}
                    variant="ghost"
                    size="sm"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-muted-foreground flex items-center gap-2 text-xs">
        <Trash2 className="size-3.5 shrink-0" aria-hidden />
        Mail threads are not included until trash-first policy is decided (O2).
      </p>
    </div>
  );
}
