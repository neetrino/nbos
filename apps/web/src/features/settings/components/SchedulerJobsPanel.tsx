'use client';

import { useCallback, useEffect, useState } from 'react';
import { Clock3, RefreshCw, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ErrorState, LoadingState, StatusBadge, type StatusVariant } from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  schedulerJobsApi,
  type PlatformSchedulerJobRow,
  type PlatformSchedulerJobsResponse,
  type SchedulerCatalogStatus,
} from '@/lib/api/scheduler-jobs';

const STATUS_LABEL: Record<SchedulerCatalogStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  blocked: 'Blocked',
  running: 'Running',
  failed: 'Failed',
  schedulerOffline: 'Scheduler offline',
  manual: 'Manual only',
  disabledByCanon: 'Disabled by canon',
};

const STATUS_VARIANT: Record<SchedulerCatalogStatus, StatusVariant> = {
  active: 'green',
  paused: 'gray',
  blocked: 'amber',
  running: 'blue',
  failed: 'red',
  schedulerOffline: 'orange',
  manual: 'violet',
  disabledByCanon: 'zinc',
};

const RISK_VARIANT: Record<PlatformSchedulerJobRow['risk'], StatusVariant> = {
  low: 'gray',
  medium: 'amber',
  high: 'red',
};

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function formatSchedule(row: PlatformSchedulerJobRow): string {
  if (row.kind === 'manual_only') return 'Manual HTTP only';
  return row.expression ?? row.defaultExpression ?? '—';
}

export function SchedulerJobsPanel() {
  const [data, setData] = useState<PlatformSchedulerJobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await schedulerJobsApi.listJobs());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load scheduler jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return <LoadingState variant="list" count={6} />;
  }

  if (error && !data) {
    return <ErrorState description={error} onRetry={() => void load()} />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-4">
      <SchedulerJobsHeader data={data} loading={loading} onRefresh={() => void load()} />
      <p className="text-muted-foreground text-sm">{data.note}</p>
      <div className="border-border bg-card overflow-x-auto rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last run</TableHead>
              <TableHead>Last result</TableHead>
              <TableHead>Next run</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.jobs.map((row) => (
              <SchedulerJobTableRow key={row.jobName} row={row} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SchedulerJobsHeader(props: {
  data: PlatformSchedulerJobsResponse;
  loading: boolean;
  onRefresh: () => void;
}) {
  const { data, loading, onRefresh } = props;
  const generatedLabel = new Date(data.generatedAt).toLocaleString();
  const masterLabel =
    data.masterEnabled === null
      ? 'Master unknown'
      : data.masterEnabled
        ? 'SCHEDULER_ENABLED on'
        : 'SCHEDULER_ENABLED off';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          variant={data.schedulerOnline ? 'green' : 'orange'}
          label={data.schedulerOnline ? 'Scheduler online' : 'Scheduler offline'}
        />
        <StatusBadge variant={data.masterEnabled ? 'green' : 'amber'} label={masterLabel} />
        <StatusBadge variant="gray" label={`TZ ${data.timezone}`} />
        <span className="text-muted-foreground text-xs">Updated {generatedLabel}</span>
      </div>
      <Button type="button" variant="outline" size="sm" disabled={loading} onClick={onRefresh}>
        <RefreshCw className={cn('mr-1.5 size-3.5', loading && 'animate-spin')} aria-hidden />
        Refresh
      </Button>
    </div>
  );
}

function SchedulerJobTableRow({ row }: { row: PlatformSchedulerJobRow }) {
  return (
    <TableRow>
      <TableCell>
        <div className="space-y-0.5">
          <p className="font-medium">{row.title}</p>
          <p className="text-muted-foreground text-xs">{row.jobName}</p>
          <p className="text-muted-foreground max-w-xs text-xs">{row.description}</p>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">{row.group}</TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-1 font-mono text-xs">
          <Timer className="size-3.5 shrink-0" aria-hidden />
          {formatSchedule(row)}
        </span>
      </TableCell>
      <TableCell>
        <StatusBadge variant={STATUS_VARIANT[row.status]} label={STATUS_LABEL[row.status]} />
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">{formatWhen(row.lastRunAt)}</TableCell>
      <TableCell className="text-sm">
        {row.lastRunStatus ?? '—'}
        {row.lastErrorMessage ? (
          <p
            className="text-destructive max-w-[12rem] truncate text-xs"
            title={row.lastErrorMessage}
          >
            {row.lastErrorMessage}
          </p>
        ) : null}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        <span className="inline-flex items-center gap-1">
          <Clock3 className="size-3.5 shrink-0" aria-hidden />
          {formatWhen(row.nextRunAt)}
        </span>
      </TableCell>
      <TableCell>
        <StatusBadge variant={RISK_VARIANT[row.risk]} label={row.risk} />
      </TableCell>
    </TableRow>
  );
}
