import { StatusBadge } from '@/components/shared';
import { BONUS_BOARD_TYPE_CONFIG } from '@/features/finance/constants/bonus-board';
import {
  BONUS_ENTRY_STATUS_LABEL,
  BONUS_ENTRY_STATUS_VARIANT,
} from '@/features/finance/constants/bonus-board-status-ui';
import { formatAmount } from '@/features/finance/constants/finance';
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
}: {
  row: BonusEntryListRow;
  onOpenReleases?: (entry: BonusEntryListRow) => void;
}) {
  const typeCfg = BONUS_BOARD_TYPE_CONFIG[row.type];
  const projectCode = row.project?.code;
  const canOpen = Boolean(onOpenReleases);

  return (
    <div
      className={cn(
        'border-border bg-card rounded-xl border px-3 py-2.5 transition-all hover:shadow-md',
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
        <p className="text-foreground min-w-0 truncate text-sm font-semibold">
          {employeeDisplayName(row.employee)}
        </p>
        <span
          className={`inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${typeCfg.color}`}
        >
          {typeCfg.label}
        </span>
      </div>

      <p className="text-foreground mt-2 text-base font-bold tabular-nums">
        {formatAmount(parseBonusAmount(row.amount))}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <StatusBadge
          label={BONUS_ENTRY_STATUS_LABEL[row.status]}
          variant={BONUS_ENTRY_STATUS_VARIANT[row.status]}
          className="text-[10px]"
        />
        {projectCode ? (
          <span className="text-muted-foreground text-[10px] font-medium">{projectCode}</span>
        ) : null}
      </div>
    </div>
  );
}
