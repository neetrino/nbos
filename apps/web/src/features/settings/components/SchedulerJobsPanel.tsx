'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ErrorState, LoadingState } from '@/components/shared';
import {
  schedulerJobsApi,
  type PlatformSchedulerJobRow,
  type PlatformSchedulerJobsResponse,
} from '@/lib/api/scheduler-jobs';
import { SchedulerJobTableRow } from './SchedulerJobTableRow';
import { SchedulerJobsHero } from './SchedulerJobsHero';
import {
  SchedulerHighRiskConfirmDialog,
  type SchedulerConfirmAction,
} from './SchedulerHighRiskConfirmDialog';

type PendingConfirm = {
  row: PlatformSchedulerJobRow;
  action: SchedulerConfirmAction;
  nextEnabled?: boolean;
};

export function SchedulerJobsPanel() {
  const [data, setData] = useState<PlatformSchedulerJobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyJob, setBusyJob] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingConfirm | null>(null);

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

  const replaceJob = (updated: PlatformSchedulerJobRow) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        jobs: prev.jobs.map((job) => (job.jobName === updated.jobName ? updated : job)),
      };
    });
  };

  const applyToggle = async (row: PlatformSchedulerJobRow, nextEnabled: boolean) => {
    setBusyJob(row.jobName);
    try {
      const updated = await schedulerJobsApi.setJobEnabled(row.jobName, { enabled: nextEnabled });
      replaceJob(updated);
      toast.success(`${updated.title} ${nextEnabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update job');
    } finally {
      setBusyJob(null);
    }
  };

  const applyRunNow = async (row: PlatformSchedulerJobRow) => {
    setBusyJob(row.jobName);
    try {
      await schedulerJobsApi.runJobNow(row.jobName);
      toast.success(`Started ${row.title}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not run job');
    } finally {
      setBusyJob(null);
    }
  };

  const handleToggle = (row: PlatformSchedulerJobRow, nextEnabled: boolean) => {
    if (!row.canToggle) return;
    if (row.risk === 'high') {
      setPending({
        row,
        action: nextEnabled ? 'enable' : 'disable',
        nextEnabled,
      });
      return;
    }
    void applyToggle(row, nextEnabled);
  };

  const handleRunNow = (row: PlatformSchedulerJobRow) => {
    if (!row.canRunNow) return;
    if (row.risk === 'high') {
      setPending({ row, action: 'run' });
      return;
    }
    void applyRunNow(row);
  };

  const handleConfirm = async () => {
    if (!pending) return;
    const current = pending;
    if (current.action === 'run') {
      await applyRunNow(current.row);
    } else {
      await applyToggle(current.row, Boolean(current.nextEnabled));
    }
    setPending(null);
  };

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
      <SchedulerJobsHero data={data} loading={loading} onRefresh={() => void load()} />
      <div className="border-border bg-card overflow-x-auto rounded-2xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Job</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last run</TableHead>
              <TableHead>Next run</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.jobs.map((row) => (
              <SchedulerJobTableRow
                key={row.jobName}
                row={row}
                timezone={data.timezone}
                busy={busyJob === row.jobName}
                onToggle={(enabled) => handleToggle(row, enabled)}
                onRunNow={() => handleRunNow(row)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <SchedulerHighRiskConfirmDialog
        open={pending !== null}
        row={pending?.row ?? null}
        action={pending?.action ?? null}
        isSubmitting={pending !== null && busyJob === pending.row.jobName}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        onConfirm={() => void handleConfirm()}
      />
    </div>
  );
}
