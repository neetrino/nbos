'use client';

import { Clock3, Play, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TableCell, TableRow } from '@/components/ui/table';
import { StatusBadge, type StatusVariant } from '@/components/shared';
import type { PlatformSchedulerJobRow, SchedulerCatalogStatus } from '@/lib/api/scheduler-jobs';

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

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function formatSchedule(row: PlatformSchedulerJobRow): string {
  if (row.kind === 'manual_only') return 'Manual HTTP only';
  return row.expression ?? row.defaultExpression ?? '—';
}

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
  onToggle: (enabled: boolean) => void;
  onRunNow: () => void;
}) {
  const { row, busy, onToggle, onRunNow } = props;
  const enabled = row.policyEnabled === true;

  return (
    <TableRow>
      <TableCell>
        <div className="space-y-0.5">
          <p className="font-medium">{row.title}</p>
          <p className="text-muted-foreground text-xs">{row.jobName}</p>
          <p className="text-muted-foreground max-w-xs text-xs">{row.description}</p>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">{row.group}</TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-1 font-mono text-xs">
          <Timer className="size-3.5 shrink-0" aria-hidden />
          {formatSchedule(row)}
        </span>
      </TableCell>
      <TableCell>
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
      <TableCell>
        <StatusBadge
          variant={SCHEDULER_STATUS_VARIANT[row.status]}
          label={SCHEDULER_STATUS_LABEL[row.status]}
        />
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">{formatWhen(row.lastRunAt)}</TableCell>
      <TableCell className="text-sm">
        {row.lastRunStatus ?? '—'}
        {row.lastErrorMessage ? (
          <p
            className="text-destructive max-w-[12rem] truncate text-xs"
            title={row.lastErrorMessage}
          >
            {row.lastErrorMessage}
          </p>
        ) : null}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        <span className="inline-flex items-center gap-1">
          <Clock3 className="size-3.5 shrink-0" aria-hidden />
          {formatWhen(row.nextRunAt)}
        </span>
      </TableCell>
      <TableCell>
        <StatusBadge variant={RISK_VARIANT[row.risk]} label={row.risk} />
      </TableCell>
      <TableCell>
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
