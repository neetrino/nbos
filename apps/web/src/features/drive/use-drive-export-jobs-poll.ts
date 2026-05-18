'use client';

import { useEffect } from 'react';
import { driveApi, type DriveZipExportJobSummary } from '@/lib/api/drive';

const DRIVE_EXPORT_JOBS_POLL_ACTIVE_MS = 2_000;
const DRIVE_EXPORT_JOBS_POLL_IDLE_MS = 12_000;

function hasActiveExportJob(jobs: DriveZipExportJobSummary[]): boolean {
  return jobs.some((job) => job.status === 'QUEUED' || job.status === 'PROCESSING');
}

/** Keeps export job list fresh while Drive is mounted (including when Analytics is closed). */
export function useDriveExportJobsPoll(onJobs: (jobs: DriveZipExportJobSummary[]) => void): void {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const jobs = await driveApi.listDriveZipExportJobs();
        if (cancelled) return;
        onJobs(jobs);
        const delay = hasActiveExportJob(jobs)
          ? DRIVE_EXPORT_JOBS_POLL_ACTIVE_MS
          : DRIVE_EXPORT_JOBS_POLL_IDLE_MS;
        timer = setTimeout(() => void poll(), delay);
      } catch {
        if (!cancelled) {
          timer = setTimeout(() => void poll(), DRIVE_EXPORT_JOBS_POLL_IDLE_MS);
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
