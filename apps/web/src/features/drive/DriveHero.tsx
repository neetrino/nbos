import type { ReactNode } from 'react';
import { Archive, BarChart3, File, FileText, Layers3, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DRIVE_SPACES, type DriveSpaceOption, type DriveViewMode } from './drive-options';
import { DriveViewModeSwitch } from './DriveViewModeSwitch';
import { formatFileSize } from './drive-format';
import type { DriveStats } from './drive-types';

const TAB_SCROLL =
  'min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export function DriveHero({
  stats,
  loading,
  selectedSpace,
  viewMode,
  insightsOpen,
  onRefresh,
  onSelectSpace,
  onViewModeChange,
  onToggleInsights,
}: {
  stats: DriveStats;
  loading: boolean;
  selectedSpace: DriveSpaceOption;
  viewMode: DriveViewMode;
  insightsOpen: boolean;
  onRefresh: () => void;
  onSelectSpace: (space: DriveSpaceOption) => void;
  onViewModeChange: (mode: DriveViewMode) => void;
  onToggleInsights: () => void;
}) {
  return (
    <section className="border-border/70 bg-card/80 rounded-2xl border px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <h1 className="text-foreground shrink-0 text-xl font-semibold tracking-tight">Drive</h1>
          <div className={TAB_SCROLL}>
            <DriveSpaceTabs selected={selectedSpace} onSelect={onSelectSpace} />
          </div>
        </div>
        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
          <DriveViewModeSwitch value={viewMode} onChange={onViewModeChange} />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onToggleInsights}
            aria-label={insightsOpen ? 'Hide analytics' : 'Analytics'}
            title={insightsOpen ? 'Hide analytics' : 'Analytics'}
            className={cn(
              insightsOpen && 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15',
            )}
          >
            <BarChart3 className="size-4" />
          </Button>
        </div>
      </div>

      {insightsOpen && <DriveInsights stats={stats} />}
    </section>
  );
}

function DriveSpaceTabs({
  selected,
  onSelect,
}: {
  selected: DriveSpaceOption;
  onSelect: (space: DriveSpaceOption) => void;
}) {
  return (
    <div
      className="bg-muted/70 inline-flex items-center gap-0.5 rounded-full p-1"
      role="tablist"
      aria-label="Drive spaces"
    >
      {DRIVE_SPACES.map((space) => {
        const active = space.key === selected.key;
        return (
          <button
            key={space.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(space)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-4',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {space.segmentLabel}
          </button>
        );
      })}
    </div>
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
