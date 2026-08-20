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
import { confirmHighRiskSchedulerAction, SchedulerJobTableRow } from './SchedulerJobTableRow';
import { SchedulerJobsHero } from './SchedulerJobsHero';

export function SchedulerJobsPanel() {
  const [data, setData] = useState<PlatformSchedulerJobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyJob, setBusyJob] = useState<string | null>(null);
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

  const replaceJob = (updated: PlatformSchedulerJobRow) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        jobs: prev.jobs.map((job) => (job.jobName === updated.jobName ? updated : job)),
      };
    });
  };

  const handleToggle = async (row: PlatformSchedulerJobRow, nextEnabled: boolean) => {
    if (!row.canToggle) return;
    if (!confirmHighRiskSchedulerAction(row, nextEnabled ? 'ENABLE' : 'DISABLE')) return;
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

  const handleRunNow = async (row: PlatformSchedulerJobRow) => {
    if (!row.canRunNow) return;
    if (!confirmHighRiskSchedulerAction(row, 'RUN NOW')) return;
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
                onToggle={(enabled) => void handleToggle(row, enabled)}
                onRunNow={() => void handleRunNow(row)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
