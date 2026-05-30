import { cn } from '@/lib/utils';

export type UnitEconomicsColumnGroup = 'in' | 'out' | 'balance';

export const UNIT_ECONOMICS_COLUMN_GROUP_LABEL: Record<UnitEconomicsColumnGroup, string> = {
  in: 'In',
  out: 'Out',
  balance: 'Balance',
};

type GroupStyle = {
  badge: string;
  headerBg: string;
  cellBg: string;
  boundary: string;
  amount: string;
};

/** In = blue, Out = amber, Balance = green — shared across headers and body cells. */
const UNIT_ECONOMICS_COLUMN_GROUP_STYLE: Record<UnitEconomicsColumnGroup, GroupStyle> = {
  in: {
    badge: 'text-sky-700 dark:text-sky-400',
    headerBg: 'bg-sky-500/[0.06]',
    cellBg: 'bg-sky-500/[0.04]',
    boundary: 'border-l-2 border-l-sky-500/35',
    amount: 'text-sky-800 dark:text-sky-300',
  },
  out: {
    badge: 'text-amber-800 dark:text-amber-400',
    headerBg: 'bg-amber-500/[0.06]',
    cellBg: 'bg-amber-500/[0.04]',
    boundary: 'border-l-2 border-l-amber-500/35',
    amount: 'text-amber-900 dark:text-amber-300',
  },
  balance: {
    badge: 'text-emerald-700 dark:text-emerald-400',
    headerBg: 'bg-emerald-500/[0.06]',
    cellBg: 'bg-emerald-500/[0.04]',
    boundary: 'border-l-2 border-l-emerald-500/35',
    amount: 'text-emerald-800 dark:text-emerald-300',
  },
};

function groupStyle(group: UnitEconomicsColumnGroup): GroupStyle {
  return UNIT_ECONOMICS_COLUMN_GROUP_STYLE[group];
}

export function unitEconomicsGroupHeaderCellClass(
  group: UnitEconomicsColumnGroup,
  isGroupStart = false,
): string {
  const meta = groupStyle(group);
  return cn(meta.headerBg, isGroupStart && meta.boundary);
}

export function unitEconomicsGroupBadgeClass(group: UnitEconomicsColumnGroup): string {
  return groupStyle(group).badge;
}

export function unitEconomicsGroupDataCellClass(
  group: UnitEconomicsColumnGroup,
  isGroupStart = false,
): string {
  const meta = groupStyle(group);
  return cn(meta.cellBg, isGroupStart && meta.boundary);
}

type AmountClassOptions = {
  fontMedium?: boolean;
  warnIfPositive?: boolean;
};

/** Amount text color aligned with column group; balance/out can warn on bad values. */
export function unitEconomicsGroupAmountClass(
  group: UnitEconomicsColumnGroup,
  value?: number,
  opts: AmountClassOptions = {},
): string {
  if (opts.warnIfPositive && value !== undefined && value > 0) {
    return cn('text-destructive', opts.fontMedium && 'font-medium');
  }
  if (group === 'balance' && value !== undefined && value < 0) {
    return cn('text-destructive', opts.fontMedium && 'font-medium');
  }
  const muted = value === 0 ? 'opacity-55' : undefined;
  return cn(groupStyle(group).amount, muted, opts.fontMedium && 'font-medium');
}

export function unitEconomicsGroupSummaryCardClass(group: UnitEconomicsColumnGroup): string {
  const meta = groupStyle(group);
  return cn(
    'border-border bg-card min-w-[7rem] flex-1 rounded-xl border px-3 py-2.5',
    meta.headerBg,
  );
}

export function unitEconomicsGroupSummaryLabelClass(group: UnitEconomicsColumnGroup): string {
  return cn('text-[10px] font-semibold tracking-wide uppercase', groupStyle(group).badge);
}
