import type { ReactNode } from 'react';
import { Archive, BarChart3, File, FileText, Layers3, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DRIVE_SPACES, type DriveSpaceOption } from './drive-options';
import { formatFileSize } from './drive-format';
import type { DriveStats } from './drive-types';

export function DriveHero({
  stats,
  loading,
  selectedSpace,
  counts,
  insightsOpen,
  onRefresh,
  onSelectSpace,
  onToggleInsights,
}: {
  stats: DriveStats;
  loading: boolean;
  selectedSpace: DriveSpaceOption;
  counts: Map<string, number>;
  insightsOpen: boolean;
  onRefresh: () => void;
  onSelectSpace: (space: DriveSpaceOption) => void;
  onToggleInsights: () => void;
}) {
  return (
    <section className="border-border/70 bg-card/80 rounded-2xl border px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">Drive</h1>
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
      <DriveSpaceTabs selected={selectedSpace} counts={counts} onSelect={onSelectSpace} />

      {insightsOpen && <DriveInsights stats={stats} />}
    </section>
  );
}

function DriveSpaceTabs({
  selected,
  counts,
  onSelect,
}: {
  selected: DriveSpaceOption;
  counts: Map<string, number>;
  onSelect: (space: DriveSpaceOption) => void;
}) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {DRIVE_SPACES.map((space) => {
        const Icon = space.icon;
        const active = space.key === selected.key;
        const count = getSpaceCount(space, counts);
        return (
          <button
            key={space.key}
            type="button"
            onClick={() => onSelect(space)}
            className={cn(
              'flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all',
              active
                ? 'border-primary/40 bg-primary text-primary-foreground shadow-sm'
                : 'border-border/70 bg-background/60 text-foreground hover:bg-muted/70',
            )}
          >
            <span
              className={cn(
                'rounded-xl p-2',
                active ? 'bg-primary-foreground/15' : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{space.title}</span>
            <span
              className={cn(
                'text-xs font-medium',
                active ? 'text-primary-foreground/80' : 'text-muted-foreground',
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function getSpaceCount(space: DriveSpaceOption, counts: Map<string, number>): number {
  return space.libraryKeys.reduce((total, key) => total + (counts.get(key) ?? 0), 0);
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
