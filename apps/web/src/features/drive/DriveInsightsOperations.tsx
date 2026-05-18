import { Download, Loader2, Package, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DriveCleanupCandidateCategory, DriveZipExportJobSummary } from '@/lib/api/drive';
import { labelDriveZipExportKind, type DriveTypedExportAction } from './drive-export-ui';

function exportStatusTone(status: DriveZipExportJobSummary['status']): string {
  if (status === 'COMPLETED') return 'text-emerald-600 dark:text-emerald-400';
  if (status === 'FAILED' || status === 'CANCELLED') return 'text-destructive';
  if (status === 'PROCESSING' || status === 'QUEUED') return 'text-primary';
  return 'text-muted-foreground';
}

export function DriveInsightsOperations({
  busy,
  typedExportActions,
  exportJobs,
  cleanupCategories,
  onTypedExport,
  onCancelExport,
  onDownloadExport,
  onRefresh,
}: {
  busy: boolean;
  typedExportActions: DriveTypedExportAction[];
  exportJobs: DriveZipExportJobSummary[];
  cleanupCategories: DriveCleanupCandidateCategory[];
  onTypedExport: (action: DriveTypedExportAction) => void;
  onCancelExport: (jobId: string) => void;
  onDownloadExport: (fileAssetId: string) => void;
  onRefresh: () => void;
}) {
  const cleanupTotal = cleanupCategories.reduce((sum, row) => sum + row.count, 0);
  const activeCategories = cleanupCategories.filter((category) => category.count > 0);

  return (
    <div className="space-y-2">
      <div className="bg-card/80 border-border/60 rounded-xl border px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-foreground text-xs font-semibold">ZIP exports</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onRefresh}
          >
            Refresh
          </Button>
        </div>
        {typedExportActions.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {typedExportActions.map((action) => (
              <Button
                key={action.id}
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={busy}
                onClick={() => onTypedExport(action)}
              >
                <Package className="size-3.5" aria-hidden />
                {action.label}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground mt-1 text-xs">
            Open a project or entity library to export by context, or select files and use bulk ZIP.
          </p>
        )}
        {exportJobs.length > 0 ? (
          <ul className="mt-3 max-h-36 space-y-1.5 overflow-y-auto">
            {exportJobs.slice(0, 12).map((job) => (
              <li
                key={job.id}
                className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-1.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-xs font-medium">
                    {job.fileAsset?.displayName ?? labelDriveZipExportKind(readExportKind(job))}
                  </p>
                  <p className={cn('text-xs capitalize', exportStatusTone(job.status))}>
                    {job.status}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {job.status === 'QUEUED' ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={busy}
                      aria-label="Cancel export"
                      onClick={() => onCancelExport(job.id)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  ) : null}
                  {job.status === 'COMPLETED' && job.fileAsset?.id ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Download export"
                      onClick={() => onDownloadExport(job.fileAsset!.id)}
                    >
                      <Download className="size-3.5" />
                    </Button>
                  ) : null}
                  {job.status === 'PROCESSING' || job.status === 'QUEUED' ? (
                    <Loader2 className="text-muted-foreground size-3.5 animate-spin" aria-hidden />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground mt-2 text-xs">No recent export jobs.</p>
        )}
      </div>

      <div className="bg-card/80 border-border/60 rounded-xl border px-3 py-2">
        <p className="text-foreground text-xs font-semibold">Cleanup review</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {cleanupTotal === 0
            ? 'No cleanup candidates right now.'
            : `${cleanupTotal} item(s) across ${activeCategories.length} categories — review only, nothing is deleted automatically.`}
        </p>
        {activeCategories.length > 0 ? (
          <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
            {activeCategories.map((category) => (
              <li key={category.kind} className="bg-muted/30 rounded-lg px-2 py-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-foreground font-medium">{category.label}</span>
                  <span className="text-muted-foreground shrink-0">{category.count}</span>
                </div>
                {category.preview.length > 0 ? (
                  <ul className="text-muted-foreground mt-1 space-y-0.5 text-[11px]">
                    {category.preview.slice(0, 5).map((item) => (
                      <li key={`${category.kind}:${item.id}`} className="truncate">
                        {item.label}
                        {item.detail ? ` · ${item.detail}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function readExportKind(job: DriveZipExportJobSummary): string | undefined {
  return job.accessSnapshot?.exportKind;
}
