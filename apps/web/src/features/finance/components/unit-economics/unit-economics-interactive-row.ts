import type { KeyboardEvent } from 'react';
import type { UnitEconomicsDrilldownFocus } from '@/lib/api/unit-economics';
import { cn } from '@/lib/utils';

export type UnitEconomicsHierarchyLevel = 0 | 1 | 2;

type DrilldownHandler = (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;

const HIERARCHY_LEVEL_BORDER: Record<UnitEconomicsHierarchyLevel, string> = {
  0: 'border-l-violet-500',
  1: 'border-l-sky-500',
  2: 'border-l-emerald-500',
};

const HIERARCHY_LEVEL_GUIDE: Record<UnitEconomicsHierarchyLevel, string> = {
  0: 'before:bg-violet-500/40',
  1: 'before:bg-sky-500/40',
  2: 'before:bg-emerald-500/40',
};

/** Row styling for project → product → order hierarchy. */
export function unitEconomicsHierarchyRowClass(
  level: UnitEconomicsHierarchyLevel,
  opts: {
    open?: boolean;
    inActiveBranch?: boolean;
    isActive?: boolean;
  } = {},
): string {
  return cn(
    'border-border cursor-pointer border-b transition-colors',
    'border-l-4',
    HIERARCHY_LEVEL_BORDER[level],
    level === 0 && 'bg-violet-500/[0.04]',
    level === 1 && 'bg-sky-500/[0.03]',
    level === 2 && 'bg-emerald-500/[0.02]',
    opts.open && level < 2 && 'bg-muted/25',
    opts.inActiveBranch && level === 0 && 'bg-violet-500/10 ring-1 ring-inset ring-violet-500/30',
    opts.inActiveBranch && level === 1 && 'bg-sky-500/10 ring-1 ring-inset ring-sky-500/30',
    opts.isActive && 'bg-primary/10 ring-1 ring-inset ring-primary/40',
    'hover:bg-muted/40',
  );
}

/** Colored vertical guide beside hierarchy labels. */
export function unitEconomicsHierarchyLabelGuideClass(level: UnitEconomicsHierarchyLevel): string {
  return cn(
    'relative pl-3 before:absolute before:top-1 before:bottom-1 before:left-0 before:w-0.5 before:rounded-full',
    HIERARCHY_LEVEL_GUIDE[level],
  );
}

/** Flat order list row — click anywhere to open the unit sheet. */
export function unitEconomicsOrderListRowClass(isActive: boolean): string {
  return cn(
    'border-border cursor-pointer border-b transition-colors hover:bg-muted/35',
    isActive && 'bg-primary/10 ring-1 ring-inset ring-primary/40',
  );
}

export function unitEconomicsHierarchyIndentStyle(level: UnitEconomicsHierarchyLevel): {
  paddingLeft: string;
} {
  const basePx = 12;
  const stepPx = 18;
  return { paddingLeft: `${basePx + level * stepPx}px` };
}

export function handleUnitEconomicsRowKeyDown(
  event: KeyboardEvent<HTMLTableRowElement>,
  action: () => void,
): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
}

export function unitEconomicsOrderRowInteractionProps({
  orderId,
  isActive,
  onDrilldown,
}: {
  orderId: string;
  isActive: boolean;
  onDrilldown?: DrilldownHandler;
}) {
  const openSheet = () => onDrilldown?.(orderId, 'invoices');

  return {
    className: unitEconomicsOrderListRowClass(isActive),
    tabIndex: 0 as const,
    role: 'button' as const,
    'aria-label': 'Open delivery unit detail',
    onClick: openSheet,
    onKeyDown: (event: KeyboardEvent<HTMLTableRowElement>) =>
      handleUnitEconomicsRowKeyDown(event, openSheet),
  };
}
