import type { ReactNode } from 'react';
import { Archive, BarChart3, File, FileText, Layers3, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatFileSize } from './drive-format';
import type { DriveStats } from './drive-types';

export function DriveHero({
  stats,
  loading,
  insightsOpen,
  onRefresh,
  onToggleInsights,
}: {
  stats: DriveStats;
  loading: boolean;
  insightsOpen: boolean;
  onRefresh: () => void;
  onToggleInsights: () => void;
}) {
  return (
    <section className="border-border/70 bg-card/80 rounded-2xl border px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">Drive</h1>
          <p className="text-muted-foreground text-xs">
            System libraries, company folders and personal files in one workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onToggleInsights}>
            <BarChart3 />
            {insightsOpen ? 'Hide insights' : 'Insights'}
          </Button>
          <Button type="button" variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={cn(loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {insightsOpen && <DriveInsights stats={stats} />}
    </section>
  );
}

function DriveInsights({ stats }: { stats: DriveStats }) {
  return (
    <div className="border-border/60 bg-background/60 mt-3 grid gap-2 rounded-2xl border p-2 sm:grid-cols-2 xl:grid-cols-5">
      <MiniStat
        label="Files"
        value={String(stats.totalFiles)}
        icon={<File className="size-3.5" />}
      />
      <MiniStat
        label="Size"
        value={formatFileSize(stats.totalSize)}
        icon={<Archive className="size-3.5" />}
      />
      <MiniStat
        label="Linked"
        value={String(stats.linkedFiles)}
        icon={<Layers3 className="size-3.5" />}
      />
      <MiniStat
        label="Approved"
        value={String(stats.approvedFiles)}
        icon={<FileText className="size-3.5" />}
      />
      <MiniStat
        label="Sensitive"
        value={String(stats.sensitiveFiles)}
        icon={<ShieldAlert className="size-3.5" />}
      />
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="bg-card flex items-center justify-between rounded-xl px-3 py-2">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-foreground text-sm font-semibold">{value}</span>
    </div>
  );
}
