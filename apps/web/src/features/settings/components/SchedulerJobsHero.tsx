'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Activity, RefreshCw, Shield, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PlatformSchedulerJobsResponse } from '@/lib/api/scheduler-jobs';
import { SchedulerInfoTip } from './SchedulerInfoTip';
import { cronFieldLabels } from './scheduler-cron-format';

export function SchedulerJobsHero(props: {
  data: PlatformSchedulerJobsResponse;
  loading: boolean;
  onRefresh: () => void;
}) {
  const { data, loading, onRefresh } = props;
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

      <div className="border-border bg-muted/30 border-t px-4 py-2.5 sm:px-5">
        <CronLegend />
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
