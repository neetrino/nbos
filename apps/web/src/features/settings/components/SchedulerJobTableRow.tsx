'use client';

import { Clock3, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TableCell, TableRow } from '@/components/ui/table';
import { StatusBadge, type StatusVariant } from '@/components/shared';
import type { PlatformSchedulerJobRow, SchedulerCatalogStatus } from '@/lib/api/scheduler-jobs';
import { SchedulerInfoTip } from './SchedulerInfoTip';
import {
  cronFieldLabels,
  cronFieldsList,
  describeCronExpression,
  formatSchedulerWhen,
  parseCronExpression,
} from './scheduler-cron-format';

export const SCHEDULER_STATUS_LABEL: Record<SchedulerCatalogStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  blocked: 'Blocked',
  running: 'Running',
  failed: 'Failed',
  schedulerOffline: 'Scheduler offline',
  manual: 'Manual only',
  disabledByCanon: 'Disabled by canon',
};

export const SCHEDULER_STATUS_VARIANT: Record<SchedulerCatalogStatus, StatusVariant> = {
  active: 'green',
  paused: 'gray',
  blocked: 'amber',
  running: 'blue',
  failed: 'red',
  schedulerOffline: 'orange',
  manual: 'violet',
  disabledByCanon: 'zinc',
};

const RISK_VARIANT: Record<PlatformSchedulerJobRow['risk'], StatusVariant> = {
  low: 'gray',
  medium: 'amber',
  high: 'red',
};

export function confirmHighRiskSchedulerAction(
  row: PlatformSchedulerJobRow,
  action: string,
): boolean {
  if (row.risk !== 'high') return true;
  return window.confirm(
    `${action} high-risk job "${row.title}" (${row.jobName})?\n\n${row.description}\n\nThis is audited.`,
  );
}

export function SchedulerJobTableRow(props: {
  row: PlatformSchedulerJobRow;
  busy: boolean;
  timezone: string;
  onToggle: (enabled: boolean) => void;
  onRunNow: () => void;
}) {
  const { row, busy, timezone, onToggle, onRunNow } = props;
  const enabled = row.policyEnabled === true;
  const expression = row.expression ?? row.defaultExpression;
  const fields = parseCronExpression(expression);
  const human = describeCronExpression(expression);

  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell className="align-top">
        <div className="flex items-start gap-1">
          <div className="min-w-0 space-y-0.5">
            <p className="leading-snug font-medium">{row.title}</p>
            <p className="text-muted-foreground font-mono text-[11px]">{row.jobName}</p>
          </div>
          <SchedulerInfoTip label={`About ${row.title}`}>
            <p className="text-foreground font-medium">{row.title}</p>
            <p className="text-muted-foreground mt-1 text-xs">{row.description}</p>
            <p className="text-muted-foreground mt-2 text-[11px]">
              Module · {row.ownerModule} · {row.group}
            </p>
          </SchedulerInfoTip>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground align-top text-sm">{row.group}</TableCell>
      <TableCell className="align-top">
        {row.kind === 'manual_only' ? (
          <span className="text-muted-foreground text-xs">Manual only</span>
        ) : fields ? (
          <div className="flex items-start gap-1">
            <div className="flex flex-wrap gap-0.5">
              {cronFieldsList(fields).map((value, index) => (
                <span
                  key={`${row.jobName}-${index}`}
                  title={cronFieldLabels()[index]}
                  className="border-border bg-muted/50 rounded-md border px-1.5 py-0.5 font-mono text-[11px] tabular-nums"
                >
                  {value}
                </span>
              ))}
            </div>
            <SchedulerInfoTip label={`Schedule for ${row.title}`} side="left">
              <p className="text-foreground text-xs font-medium">{human}</p>
              <div className="mt-2 space-y-1">
                {cronFieldLabels().map((label, index) => (
                  <div
                    key={label}
                    className="text-muted-foreground flex items-center justify-between gap-3 text-[11px]"
                  >
                    <span>{label}</span>
                    <span className="text-foreground font-mono tabular-nums">
                      {cronFieldsList(fields)[index]}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground mt-2 border-t pt-2 text-[11px]">
                Next · {formatSchedulerWhen(row.nextRunAt, timezone)}
              </p>
            </SchedulerInfoTip>
          </div>
        ) : (
          <span className="font-mono text-xs">{expression ?? '—'}</span>
        )}
      </TableCell>
      <TableCell className="align-top">
        {row.canToggle ? (
          <Switch
            checked={enabled}
            disabled={busy}
            onCheckedChange={(checked) => onToggle(checked)}
            aria-label={`${enabled ? 'Disable' : 'Enable'} ${row.title}`}
          />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell className="align-top">
        <StatusBadge
          variant={SCHEDULER_STATUS_VARIANT[row.status]}
          label={SCHEDULER_STATUS_LABEL[row.status]}
        />
      </TableCell>
      <TableCell className="align-top">
        <div className="space-y-1.5 text-xs">
          <div>
            <p className="text-muted-foreground text-[10px] tracking-wide uppercase">Last</p>
            <p className="tabular-nums">{formatSchedulerWhen(row.lastRunAt, timezone)}</p>
          </div>
          <div className="border-border/60 border-t pt-1.5">
            <p className="text-muted-foreground inline-flex items-center gap-1 text-[10px] tracking-wide uppercase">
              <Clock3 className="size-3" aria-hidden />
              Next
            </p>
            <p className="tabular-nums">{formatSchedulerWhen(row.nextRunAt, timezone)}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="align-top text-sm">
        <p className="text-xs font-medium">{row.lastRunStatus ?? '—'}</p>
        {row.lastErrorMessage ? (
          <p
            className="text-destructive mt-0.5 max-w-[10rem] truncate text-[11px]"
            title={row.lastErrorMessage}
          >
            {row.lastErrorMessage}
          </p>
        ) : null}
      </TableCell>
      <TableCell className="align-top">
        <StatusBadge variant={RISK_VARIANT[row.risk]} label={row.risk} />
      </TableCell>
      <TableCell className="align-top">
        {row.canRunNow ? (
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onRunNow}>
            <Play className="mr-1 size-3.5" aria-hidden />
            Run
          </Button>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}
