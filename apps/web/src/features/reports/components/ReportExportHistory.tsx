'use client';

import { Download, RotateCcw, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReportExportJob } from '@/lib/api/reports';
import { formatReportFilters } from '../report-filters';

interface ReportExportHistoryProps {
  jobs: ReportExportJob[];
  onRefresh: () => void;
  onRetry: (jobId: string) => void;
  onCancel: (jobId: string) => void;
}

export function ReportExportHistory({
  jobs,
  onRefresh,
  onRetry,
  onCancel,
}: ReportExportHistoryProps) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <p className="text-xl font-semibold">Export history</p>
          <p className="text-muted-foreground text-sm">
            Generated report files are stored in Drive and audited.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-6 text-center">
          <Download className="text-muted-foreground mx-auto h-8 w-8" />
          <p className="mt-3 font-medium">No export jobs yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Request an export from any report card.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {jobs.map((job) => (
            <ReportExportRow key={job.id} job={job} onRetry={onRetry} onCancel={onCancel} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportExportRow({
  job,
  onRetry,
  onCancel,
}: {
  job: ReportExportJob;
  onRetry: (jobId: string) => void;
  onCancel: (jobId: string) => void;
}) {
  const canRetry = job.status === 'FAILED' || job.status === 'CANCELLED';
  const canCancel = job.status === 'QUEUED' || job.status === 'PROCESSING';
  return (
    <div className="rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{job.reportTitle}</p>
          <p className="text-muted-foreground text-sm">
            {job.ownerModule} · {job.format} · queued {new Date(job.queuedAt).toLocaleString()}
          </p>
        </div>
        <span className="bg-muted rounded-full px-2.5 py-1 text-xs font-medium">{job.status}</span>
      </div>
      {job.fileAsset ? (
        <p className="text-muted-foreground mt-2 text-sm">
          Drive file: {job.fileAsset.displayName}
        </p>
      ) : null}
      <p className="text-muted-foreground mt-2 text-sm">
        Filters: {formatReportFilters(job.filters ?? {})}
      </p>
      {(canRetry || canCancel) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {canRetry ? (
            <Button type="button" variant="outline" size="sm" onClick={() => onRetry(job.id)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          ) : null}
          {canCancel ? (
            <Button type="button" variant="outline" size="sm" onClick={() => onCancel(job.id)}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
