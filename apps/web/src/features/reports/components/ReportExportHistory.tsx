'use client';

import { Download, Loader2, RefreshCw, RotateCcw, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { driveApi } from '@/lib/api/drive';
import type { ReportExportJob } from '@/lib/api/reports';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  canCancelReportExport,
  canDownloadReportExport,
  canRetryReportExport,
  isActiveReportExport,
} from '../report-export-job-actions';
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
      <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
        <div>
          <p className="text-xl font-semibold">Report files</p>
          <p className="text-muted-foreground text-sm">
            Files you create from a report tab are stored here. Download when status is Completed.
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
          <p className="mt-3 font-medium">No report files yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Open Finance, Sales or another report tab, set the dates, then create CSV, XLSX or PDF
            from settings. The file appears here.
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
  const canRetry = canRetryReportExport(job);
  const canCancel = canCancelReportExport(job);
  const canDownload = canDownloadReportExport(job);
  const isActive = isActiveReportExport(job);

  return (
    <div className="rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{job.reportTitle}</p>
          <p className="text-muted-foreground text-sm">
            {job.ownerModule} · {job.format} · {new Date(job.queuedAt).toLocaleString()}
          </p>
        </div>
        <span className="bg-muted rounded-full px-2.5 py-1 text-xs font-medium">{job.status}</span>
      </div>
      {job.fileAsset ? (
        <p className="text-muted-foreground mt-2 text-sm">{job.fileAsset.displayName}</p>
      ) : null}
      <p className="text-muted-foreground mt-2 text-sm">
        Dates: {formatReportFilters(job.filters ?? {})}
      </p>
      {job.errorMessage ? (
        <p className="text-destructive mt-2 text-sm">{job.errorMessage}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canDownload ? (
          <Button
            type="button"
            size="sm"
            onClick={() => void downloadReportFile(job.fileAsset!.id)}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        ) : null}
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
        {isActive ? (
          <Loader2 className="text-muted-foreground size-4 animate-spin" aria-hidden />
        ) : null}
      </div>
    </div>
  );
}

async function downloadReportFile(fileAssetId: string): Promise<void> {
  try {
    const { url } = await driveApi.getFileAssetPreviewUrl(fileAssetId);
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (caught) {
    toast.error(getApiErrorMessage(caught, 'Could not open the report file.'));
  }
}
