import {
  Archive,
  File,
  FileText,
  Layers3,
  RefreshCw,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatFileSize } from './drive-format';
import type { DriveStats } from './drive-types';

export function DriveHero({
  stats,
  loading,
  onRefresh,
}: {
  stats: DriveStats;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="border-border/70 bg-card/80 overflow-hidden rounded-3xl border p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-muted-foreground text-sm">NBOS Drive</p>
          <h1 className="text-foreground mt-1 text-3xl font-semibold tracking-tight">
            Logical libraries for every business file
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
            One physical file can appear in deals, products, clients, finance and support without
            duplication. Use libraries and metadata to find the right file fast.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={cn(loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Visible files" value={String(stats.totalFiles)} icon={File} />
        <StatCard label="Storage in view" value={formatFileSize(stats.totalSize)} icon={Archive} />
        <StatCard label="Linked files" value={String(stats.linkedFiles)} icon={Layers3} />
        <StatCard label="Approved" value={String(stats.approvedFiles)} icon={FileText} />
        <StatCard label="Sensitive" value={String(stats.sensitiveFiles)} icon={ShieldAlert} />
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="bg-background/70 border-border/60 rounded-2xl border p-4">
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <Icon className="size-4" />
        {label}
      </div>
      <div className="text-foreground mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}
