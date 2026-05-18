import type { ReactNode } from 'react';
import {
  Archive,
  BarChart3,
  Eraser,
  File,
  FileText,
  Layers3,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DRIVE_SPACES, type DriveSpaceOption, type DriveViewMode } from './drive-options';
import { DriveToolbar } from './DriveToolbar';
import { DriveViewModeSwitch } from './DriveViewModeSwitch';
import { formatFileSize } from './drive-format';
import type { DriveStats } from './drive-types';

const TAB_SCROLL =
  'min-w-0 max-w-[min(100%,20rem)] shrink-0 overflow-x-auto sm:max-w-[min(100%,26rem)] md:max-w-[min(100%,32rem)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export function DriveHero({
  stats,
  loading,
  selectedSpace,
  viewMode,
  insightsOpen,
  search,
  onSearchChange,
  onRefresh,
  onSelectSpace,
  onViewModeChange,
  onToggleInsights,
  maintenanceCleanup,
  libraryLinkAggregates,
}: {
  stats: DriveStats;
  loading: boolean;
  selectedSpace: DriveSpaceOption;
  viewMode: DriveViewMode;
  insightsOpen: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onSelectSpace: (space: DriveSpaceOption) => void;
  onViewModeChange: (mode: DriveViewMode) => void;
  onToggleInsights: () => void;
  maintenanceCleanup?: {
    failedUploadSessions: number;
    expiredPendingUploadSessions: number;
    purgeBusy: boolean;
    onPurgeFailed: () => void;
    onPurgeExpired: () => void;
    onResetTestData?: () => void;
  } | null;
  libraryLinkAggregates?: { entityType: string; entityId: string; count: number }[];
}) {
  return (
    <section className="border-border/70 bg-card/80 rounded-2xl border px-4 py-3 shadow-sm">
      <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-4">
          <h1 className="text-foreground shrink-0 text-xl font-semibold tracking-tight">Drive</h1>
          <div className={TAB_SCROLL}>
            <DriveSpaceTabs selected={selectedSpace} onSelect={onSelectSpace} />
          </div>
        </div>
        <div className="w-full min-w-0 flex-1 basis-full sm:basis-0 sm:px-1">
          <div className="mx-auto max-w-3xl">
            <DriveToolbar search={search} onSearchChange={onSearchChange} variant="header" />
          </div>
        </div>
        <div className="ml-auto flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto">
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

      {insightsOpen && (
        <DriveInsights
          stats={stats}
          maintenance={maintenanceCleanup ?? null}
          linkAggregates={libraryLinkAggregates ?? []}
        />
      )}
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
        const Icon = space.icon;
        return (
          <button
            key={space.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(space)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold tracking-tight whitespace-nowrap transition-colors sm:px-3.5',
              active
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-foreground/85 hover:bg-muted/80 hover:text-foreground',
            )}
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full',
                active
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
            {space.segmentLabel}
          </button>
        );
      })}
    </div>
  );
}

function DriveInsights({
  stats,
  maintenance,
  linkAggregates,
}: {
  stats: DriveStats;
  maintenance: {
    failedUploadSessions: number;
    expiredPendingUploadSessions: number;
    purgeBusy: boolean;
    onPurgeFailed: () => void;
    onPurgeExpired: () => void;
    onResetTestData?: () => void;
  } | null;
  linkAggregates: { entityType: string; entityId: string; count: number }[];
}) {
  return (
    <div className="border-border/60 bg-background/60 mt-3 space-y-2 rounded-2xl border p-2">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
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

      {maintenance ? (
        <div className="bg-card/80 border-border/60 flex flex-col gap-2 rounded-xl border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground text-xs">
            <span className="text-foreground font-medium">Upload cleanup</span> — failed{' '}
            {maintenance.failedUploadSessions}, expired pending{' '}
            {maintenance.expiredPendingUploadSessions}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={maintenance.purgeBusy || maintenance.failedUploadSessions === 0}
              onClick={() => maintenance.onPurgeFailed()}
            >
              <Eraser className="size-3.5" aria-hidden />
              Purge failed
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={maintenance.purgeBusy || maintenance.expiredPendingUploadSessions === 0}
              onClick={() => maintenance.onPurgeExpired()}
            >
              <Eraser className="size-3.5" aria-hidden />
              Purge expired
            </Button>
            {maintenance.onResetTestData ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="gap-1"
                disabled={maintenance.purgeBusy}
                onClick={() => maintenance.onResetTestData?.()}
              >
                <Eraser className="size-3.5" aria-hidden />
                Reset all test data
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {linkAggregates.length > 0 ? (
        <div className="bg-card/80 border-border/60 rounded-xl border px-3 py-2">
          <p className="text-foreground text-xs font-semibold">
            Cross-links in this library context
          </p>
          <ul className="text-muted-foreground mt-2 max-h-28 space-y-1 overflow-y-auto text-xs">
            {linkAggregates.slice(0, 24).map((row) => (
              <li key={`${row.entityType}:${row.entityId}`} className="flex justify-between gap-2">
                <span className="truncate">
                  {row.entityType} · {row.entityId.slice(0, 12)}
                  {row.entityId.length > 12 ? '…' : ''}
                </span>
                <span className="shrink-0 font-medium">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
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
