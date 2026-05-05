import {
  Search,
  ChevronDown,
  Gift,
  User,
  FolderKanban,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import {
  BONUS_BOARD_STATUSES,
  BONUS_BOARD_TYPE_CONFIG,
} from '@/features/finance/constants/bonus-board';
import { formatAmount } from '@/features/finance/constants/finance';
import type { BonusEntryListRow, BonusStatus, BonusType } from '@/lib/api/bonus';
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

export function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  accent?: boolean;
}) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <div
          className={`rounded-xl p-2 ${accent ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground'}`}
        >
          <Icon size={16} />
        </div>
      </div>
      <p className="text-foreground mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

export function BonusCard({
  row,
  onOpenReleases,
}: {
  row: BonusEntryListRow;
  onOpenReleases?: (entry: BonusEntryListRow) => void;
}) {
  const typeCfg = BONUS_BOARD_TYPE_CONFIG[row.type];
  const project = projectLabel(row.project);

  return (
    <div
      className={cn(
        'group border-border bg-card rounded-xl border p-3.5 transition-all hover:shadow-md',
        onOpenReleases &&
          'focus-visible:ring-ring cursor-pointer focus-visible:ring-2 focus-visible:outline-none',
      )}
      role={onOpenReleases ? 'button' : undefined}
      tabIndex={onOpenReleases ? 0 : undefined}
      onClick={() => onOpenReleases?.(row)}
      onKeyDown={(e) => {
        if (!onOpenReleases) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenReleases(row);
        }
      }}
    >
      <div className="flex items-start justify-between">
        <div className="text-foreground flex items-center gap-1.5 text-sm font-medium">
          <User size={12} className="text-muted-foreground" />
          {employeeDisplayName(row.employee)}
        </div>
        <span
          className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium ${typeCfg.color}`}
        >
          {typeCfg.label}
        </span>
      </div>

      <div className="text-foreground mt-2.5 flex items-center gap-1 text-sm font-semibold">
        <DollarSign size={12} className="text-accent" />
        {formatAmount(parseBonusAmount(row.amount))}
      </div>

      {project && (
        <div className="text-muted-foreground mt-2 flex items-center gap-1 text-[10px]">
          <FolderKanban size={10} />
          {project}
        </div>
      )}

      {onOpenReleases ? (
        <p className="text-muted-foreground border-border mt-2.5 border-t pt-2 text-[10px]">
          Open release ledger — adjust APPROVED / DRAFT amounts before payroll.
        </p>
      ) : null}
    </div>
  );
}

export function BonusBoardToolbar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  projectFilter,
  onProjectFilterChange,
  uniqueProjects,
  employeeFilter,
  onEmployeeFilterChange,
  uniqueEmployees,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: BonusType | 'ALL';
  onTypeFilterChange: (value: BonusType | 'ALL') => void;
  projectFilter: string;
  onProjectFilterChange: (value: string) => void;
  uniqueProjects: { id: string; code: string; label: string }[];
  employeeFilter: string;
  onEmployeeFilterChange: (value: string) => void;
  uniqueEmployees: { id: string; label: string }[];
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <div className="relative flex-1">
        <Search
          size={16}
          className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by employee, project, or order…"
          className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
        />
      </div>
      <div className="relative">
        <ChevronDown
          size={14}
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
        />
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value as BonusType | 'ALL')}
          className="border-input bg-card text-foreground focus:ring-ring appearance-none rounded-xl border py-2.5 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
        >
          <option value="ALL">All Types</option>
          {(Object.keys(BONUS_BOARD_TYPE_CONFIG) as BonusType[]).map((key) => (
            <option key={key} value={key}>
              {BONUS_BOARD_TYPE_CONFIG[key].label}
            </option>
          ))}
        </select>
      </div>
      <div className="relative min-w-[10rem]">
        <ChevronDown
          size={14}
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
        />
        <select
          value={projectFilter}
          onChange={(e) => onProjectFilterChange(e.target.value)}
          className="border-input bg-card text-foreground focus:ring-ring max-w-[220px] appearance-none rounded-xl border py-2.5 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
        >
          <option value="ALL">All Projects</option>
          {uniqueProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="relative">
        <ChevronDown
          size={14}
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
        />
        <select
          value={employeeFilter}
          onChange={(e) => onEmployeeFilterChange(e.target.value)}
          className="border-input bg-card text-foreground focus:ring-ring appearance-none rounded-xl border py-2.5 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
        >
          <option value="ALL">All Employees</option>
          {uniqueEmployees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function BonusBoardColumns({
  filtered,
  onOpenReleases,
}: {
  filtered: BonusEntryListRow[];
  onOpenReleases?: (entry: BonusEntryListRow) => void;
}) {
  const columns = BONUS_BOARD_STATUSES.map((status) => ({
    ...status,
    bonuses: filtered.filter((b) => b.status === status.key),
  }));

  return (
    <div className="mt-6 flex-1 overflow-x-auto">
      <div
        className="flex gap-4 pb-4"
        style={{ minWidth: `${BONUS_BOARD_STATUSES.length * 260}px` }}
      >
        {columns.map((column) => (
          <div key={column.key} className="w-[240px] flex-shrink-0">
            <div className="mb-3 flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${column.color}`} />
              <h3 className="text-foreground text-xs font-semibold">{column.label}</h3>
              <span className="bg-secondary text-muted-foreground ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                {column.bonuses.length}
              </span>
            </div>
            <div className="space-y-3">
              {column.bonuses.map((bonus) => (
                <BonusCard key={bonus.id} row={bonus} onOpenReleases={onOpenReleases} />
              ))}
              {column.bonuses.length === 0 && (
                <div className="border-border rounded-xl border border-dashed p-8 text-center">
                  <Gift size={20} className="text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground mt-2 text-[10px]">No bonuses</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
