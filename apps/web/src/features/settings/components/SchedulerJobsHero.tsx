'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Activity, RefreshCw, Search, Shield, Timer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LIST_SEARCH_INPUT_PROPS } from '@/components/shared/list-search-input-props';
import { cn } from '@/lib/utils';
import type { PlatformSchedulerJobsResponse } from '@/lib/api/scheduler-jobs';
import { SchedulerInfoTip } from './SchedulerInfoTip';
import { cronFieldLabels } from './scheduler-cron-format';

const JOBS_SEARCH_PLACEHOLDER = 'Search jobs…';

export function SchedulerJobsHero(props: {
  data: PlatformSchedulerJobsResponse;
  loading: boolean;
  search: string;
  visibleCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}) {
  const { data, loading, search, visibleCount, totalCount, onSearchChange, onRefresh } = props;
  const updatedLabel = new Date(data.generatedAt).toLocaleString();
  const masterOn = data.masterEnabled === true;
  const online = data.schedulerOnline;

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="border-border bg-card overflow-hidden rounded-2xl border"
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="bg-muted/50 border-border relative mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl border">
            <Timer className="text-primary size-5" aria-hidden />
            <span
              className={cn(
                'ring-background absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2',
                online ? 'bg-emerald-500' : 'bg-amber-500',
                online && 'animate-pulse',
              )}
              aria-hidden
            />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="text-base font-semibold tracking-tight">Platform crons</h2>
              <SchedulerInfoTip label="About Scheduler">
                <p className="text-foreground font-medium">Settings → Scheduler</p>
                <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-4 text-xs">
                  <li>Toggle jobs and Run now here (audited).</li>
                  <li>Cron schedule changes only in code / deploy.</li>
                  <li>Kill switch: SCHEDULER_ENABLED in env.</li>
                </ul>
              </SchedulerInfoTip>
            </div>
            <p className="text-muted-foreground text-xs">
              Automatic jobs · timezone {data.timezone}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusChip
            icon={<Activity className="size-3.5" aria-hidden />}
            ok={online}
            label={online ? 'Online' : 'Offline'}
          />
          <StatusChip
            icon={<Shield className="size-3.5" aria-hidden />}
            ok={masterOn}
            label={masterOn ? 'Master on' : 'Master off'}
          />
          <span className="text-muted-foreground text-[11px]">Updated {updatedLabel}</span>
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={onRefresh}>
            <RefreshCw className={cn('mr-1.5 size-3.5', loading && 'animate-spin')} aria-hidden />
            Refresh
          </Button>
        </div>
      </div>

      <div className="border-border bg-muted/30 flex flex-col gap-2.5 border-t px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <CronLegend />
        <SchedulerJobsSearch
          value={search}
          visibleCount={visibleCount}
          totalCount={totalCount}
          onChange={onSearchChange}
        />
      </div>
    </motion.section>
  );
}

function StatusChip(props: { icon: ReactNode; ok: boolean; label: string }) {
  const { icon, ok, label } = props;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        ok
          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          : 'border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200',
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function SchedulerJobsSearch(props: {
  value: string;
  visibleCount: number;
  totalCount: number;
  onChange: (value: string) => void;
}) {
  const { value, visibleCount, totalCount, onChange } = props;
  const hasQuery = value.trim().length > 0;

  return (
    <div className="flex min-w-0 items-center gap-2 sm:max-w-xs sm:flex-1">
      <div className="relative min-w-0 flex-1">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
          aria-hidden
        />
        <Input
          {...LIST_SEARCH_INPUT_PROPS}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={JOBS_SEARCH_PLACEHOLDER}
          aria-label={JOBS_SEARCH_PLACEHOLDER}
          role="searchbox"
          className="bg-background h-8 rounded-lg pl-8 text-sm shadow-none"
        />
        {hasQuery ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-1 size-6 -translate-y-1/2 rounded-full"
            aria-label="Clear search"
            onClick={() => onChange('')}
          >
            <X className="size-3.5" aria-hidden />
          </Button>
        ) : null}
      </div>
      {hasQuery ? (
        <span className="text-muted-foreground shrink-0 text-[11px]">
          {visibleCount} of {totalCount}
        </span>
      ) : null}
    </div>
  );
}

function CronLegend() {
  const labels = cronFieldLabels();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="text-muted-foreground text-[10px] font-semibold tracking-[0.14em] uppercase">
        Cron fields
      </span>
      <div className="flex flex-wrap gap-1">
        {labels.map((label) => (
          <span
            key={label}
            className="border-border bg-background text-muted-foreground rounded-md border px-1.5 py-0.5 font-mono text-[10px]"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
