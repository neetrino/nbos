import { User, FolderKanban, DollarSign } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { BONUS_BOARD_TYPE_CONFIG } from '@/features/finance/constants/bonus-board';
import {
  BONUS_ENTRY_STATUS_LABEL,
  BONUS_ENTRY_STATUS_VARIANT,
  isBonusEntryTerminalStatus,
} from '@/features/finance/constants/bonus-board-status-ui';
import { formatAmount } from '@/features/finance/constants/finance';
import { bonusSalesAccrualHint } from '@/features/finance/utils/bonus-sales-accrual-hint';
import type { BonusEntryListRow, BonusStatus } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

export function employeeDisplayName(employee: BonusEntryListRow['employee']): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

export function parseBonusAmount(amount: string): number {
  const n = Number.parseFloat(amount);
  return Number.isFinite(n) ? n : 0;
}

export function sumBonusEntryAmounts(rows: ReadonlyArray<BonusEntryListRow>): number {
  let total = 0;
  for (const r of rows) {
    total += parseBonusAmount(r.amount);
  }
  return total;
}

export function countBonusEntriesWithStatus(
  rows: ReadonlyArray<BonusEntryListRow>,
  status: BonusStatus,
): number {
  let n = 0;
  for (const r of rows) {
    if (r.status === status) n += 1;
  }
  return n;
}

export function projectLabel(project: BonusEntryListRow['project']): string | null {
  if (!project?.name && !project?.code) return null;
  if (project.code && project.name) return `${project.code} · ${project.name}`;
  return project.name ?? project.code ?? null;
}

export function uniqueEmployeesFromRows(
  rows: BonusEntryListRow[],
): { id: string; label: string }[] {
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.employee.id, employeeDisplayName(row.employee));
  }
  return [...map.entries()].map(([id, label]) => ({ id, label }));
}

/** Distinct projects from loaded bonus rows (for board filter dropdown). */
export function uniqueProjectsFromRows(
  rows: BonusEntryListRow[],
): { id: string; code: string; label: string }[] {
  const map = new Map<string, { id: string; code: string; label: string }>();
  for (const row of rows) {
    const p = row.project;
    if (!p?.id) continue;
    const label = projectLabel(p) ?? p.code ?? p.id;
    map.set(p.id, { id: p.id, code: p.code ?? '—', label });
  }
  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}

export function BonusCard({
  row,
  onOpenReleases,
  readOnly = false,
}: {
  row: BonusEntryListRow;
  onOpenReleases?: (entry: BonusEntryListRow) => void;
  readOnly?: boolean;
}) {
  const typeCfg = BONUS_BOARD_TYPE_CONFIG[row.type];
  const project = projectLabel(row.project);
  const salesHint = bonusSalesAccrualHint(row);
  const terminal = isBonusEntryTerminalStatus(row.status);
  const canOpen = Boolean(onOpenReleases);
  const percent = Number.parseFloat(row.percent);
  const showPercent = Number.isFinite(percent) && percent > 0;

  return (
    <div
      className={cn(
        'group border-border bg-card rounded-xl border p-3.5 transition-all hover:shadow-md',
        canOpen &&
          'focus-visible:ring-ring cursor-pointer focus-visible:ring-2 focus-visible:outline-none',
      )}
      role={canOpen ? 'button' : undefined}
      tabIndex={canOpen ? 0 : undefined}
      onClick={() => canOpen && onOpenReleases?.(row)}
      onKeyDown={(e) => {
        if (!canOpen) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenReleases?.(row);
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-foreground flex min-w-0 items-center gap-1.5 text-sm font-medium">
          <User size={12} className="text-muted-foreground shrink-0" />
          <span className="truncate">{employeeDisplayName(row.employee)}</span>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${typeCfg.color}`}
        >
          {typeCfg.label}
        </span>
      </div>

      <div className="text-foreground mt-2.5 flex items-center gap-1 text-sm font-semibold">
        <DollarSign size={12} className="text-accent shrink-0" />
        {formatAmount(parseBonusAmount(row.amount))}
        {showPercent ? (
          <span className="text-muted-foreground text-[10px] font-normal">· {percent}%</span>
        ) : null}
      </div>

      <div className="mt-2">
        <StatusBadge
          label={BONUS_ENTRY_STATUS_LABEL[row.status]}
          variant={BONUS_ENTRY_STATUS_VARIANT[row.status]}
          className="text-[10px]"
        />
      </div>

      {salesHint ? (
        <p className="text-muted-foreground mt-1.5 text-[10px] leading-snug">{salesHint}</p>
      ) : null}

      {project ? (
        <div className="text-muted-foreground mt-2 flex items-center gap-1 text-[10px]">
          <FolderKanban size={10} className="shrink-0" />
          <span className="truncate">{project}</span>
        </div>
      ) : null}

      {row.payoutMonth ? (
        <p className="text-muted-foreground mt-1 text-[10px] tabular-nums">
          Payroll month · {row.payoutMonth}
        </p>
      ) : null}

      {canOpen ? (
        <p className="text-muted-foreground border-border mt-2.5 border-t pt-2 text-[10px]">
          {readOnly || terminal
            ? 'View release ledger and payout history.'
            : 'Open release ledger — adjust APPROVED / DRAFT amounts before payroll.'}
        </p>
      ) : null}
    </div>
  );
}
