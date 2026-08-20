'use client';

import { useEffect } from 'react';
import { reportsApi, type ReportExportJob } from '@/lib/api/reports';

const REPORT_EXPORT_JOBS_POLL_ACTIVE_MS = 2_000;
const REPORT_EXPORT_JOBS_POLL_IDLE_MS = 12_000;

export function hasActiveReportExportJob(jobs: ReportExportJob[]): boolean {
  return jobs.some((job) => job.status === 'QUEUED' || job.status === 'PROCESSING');
}

/** Refreshes export jobs while Reports is mounted so completed files appear without a manual refresh. */
export function useReportExportJobsPoll(onJobs: (jobs: ReportExportJob[]) => void): void {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const jobs = await reportsApi.listExportJobs();
        if (cancelled) return;
        onJobs(jobs);
        const delay = hasActiveReportExportJob(jobs)
          ? REPORT_EXPORT_JOBS_POLL_ACTIVE_MS
          : REPORT_EXPORT_JOBS_POLL_IDLE_MS;
        timer = setTimeout(() => void poll(), delay);
      } catch {
        if (!cancelled) {
          timer = setTimeout(() => void poll(), REPORT_EXPORT_JOBS_POLL_IDLE_MS);
        }
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [onJobs]);
}
