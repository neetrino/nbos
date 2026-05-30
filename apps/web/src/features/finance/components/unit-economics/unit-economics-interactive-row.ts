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

const HIERARCHY_LEVEL_TINT: Record<UnitEconomicsHierarchyLevel, string> = {
  0: 'bg-violet-500/[0.04]',
  1: 'bg-sky-500/[0.03]',
  2: 'bg-emerald-500/[0.02]',
};

const EXPANDED_PROJECT_ROW_CLASS =
  'border-l-violet-600 bg-violet-500/12 ring-1 ring-inset ring-violet-500/35';

const EXPANDED_PROJECT_GUIDE_CLASS = 'before:w-1 before:bg-violet-500/75';

const EXPANDED_PROJECT_TITLE_CLASS = 'text-violet-950 dark:text-violet-100';

/** Row styling for project → product → order hierarchy. Colors apply only on the expanded path. */
export function unitEconomicsHierarchyRowClass(
  level: UnitEconomicsHierarchyLevel,
  opts: {
    highlighted?: boolean;
    open?: boolean;
    isActive?: boolean;
  } = {},
): string {
  const highlighted = opts.highlighted ?? false;
  const isExpandedProject = level === 0 && highlighted && opts.open;

  return cn(
    'border-border cursor-pointer border-b bg-card transition-colors',
    'border-l-4',
    !highlighted && 'border-l-transparent',
    highlighted && !isExpandedProject && HIERARCHY_LEVEL_BORDER[level],
    isExpandedProject && EXPANDED_PROJECT_ROW_CLASS,
    !isExpandedProject && highlighted && HIERARCHY_LEVEL_TINT[level],
    highlighted && opts.open && level === 1 && 'bg-sky-500/[0.06]',
    opts.isActive && 'bg-primary/10 ring-1 ring-inset ring-primary/40',
    highlighted ? 'hover:bg-muted/40' : 'hover:bg-muted/30',
  );
}

/** Colored vertical guide beside hierarchy labels (expanded path only). */
export function unitEconomicsHierarchyLabelGuideClass(
  level: UnitEconomicsHierarchyLevel,
  highlighted: boolean,
  opts: { expandedProject?: boolean } = {},
): string {
  const expandedProject = opts.expandedProject ?? false;

  return cn(
    'relative pl-3 before:absolute before:top-1 before:bottom-1 before:left-0 before:w-0.5 before:rounded-full',
    expandedProject && EXPANDED_PROJECT_GUIDE_CLASS,
    !expandedProject && highlighted && HIERARCHY_LEVEL_GUIDE[level],
    !expandedProject && !highlighted && 'before:bg-transparent',
  );
}

/** Title emphasis for the currently expanded project row. */
export function unitEconomicsHierarchyTitleClass(
  emphasized: boolean,
  expandedProject: boolean,
): string {
  return cn(
    emphasized ? 'font-semibold' : 'font-medium',
    expandedProject && EXPANDED_PROJECT_TITLE_CLASS,
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
