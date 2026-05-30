'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/shared';
import {
  buildUnitEconomicsTree,
  type UnitEconomicsTreeProduct,
  type UnitEconomicsTreeProject,
} from '@/features/finance/components/unit-economics/build-unit-economics-tree';
import type { UnitEconomicsBoardData } from '@/features/finance/components/unit-economics/unit-economics-board-data';
import {
  handleUnitEconomicsRowKeyDown,
  unitEconomicsHierarchyIndentStyle,
  unitEconomicsHierarchyLabelGuideClass,
  unitEconomicsHierarchyRowClass,
  unitEconomicsHierarchyTitleClass,
} from '@/features/finance/components/unit-economics/unit-economics-interactive-row';
import { unitEconomicsOrderTypeLabel } from '@/features/finance/components/unit-economics/unit-economics-order-type-label';
import { UnitEconomicsOverviewMoneyCells } from '@/features/finance/components/unit-economics/unit-economics-row-money-cells';
import { UnitEconomicsOverviewFooter } from '@/features/finance/components/unit-economics/unit-economics-table-footer';
import {
  UnitEconomicsTableHead,
  UnitEconomicsTableShell,
} from '@/features/finance/components/unit-economics/unit-economics-table-shell';
import type { UnitEconomicsDrilldownFocus, UnitEconomicsRow } from '@/lib/api/unit-economics';
import { cn } from '@/lib/utils';

type DrilldownHandler = (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;

type ActiveBranch = {
  projectId: string;
  productKey: string;
};

function HierarchyChevron({ open }: { open: boolean }) {
  const Icon = open ? ChevronDown : ChevronRight;
  return <Icon className="text-muted-foreground size-3.5 shrink-0" aria-hidden />;
}

function OrderLabelCell({
  row,
  indent,
  highlighted,
}: {
  row: UnitEconomicsRow;
  indent: 2;
  highlighted: boolean;
}) {
  const typeLabel = unitEconomicsOrderTypeLabel(row.orderType);
  const indentStyle = unitEconomicsHierarchyIndentStyle(indent);

  return (
    <td className="border-border border-b px-3 py-2" style={indentStyle}>
      <div
        className={cn(
          'flex items-start gap-1.5',
          unitEconomicsHierarchyLabelGuideClass(indent, highlighted),
        )}
      >
        <span className="mt-1 size-3.5 shrink-0" aria-hidden />
        <div className="min-w-0">
          <span className="font-medium tabular-nums">{row.orderCode}</span>
          <p className="text-muted-foreground truncate text-[11px]">
            {row.label} · {typeLabel} · {row.deliveryOpen ? 'open' : 'closed'}
          </p>
        </div>
      </div>
    </td>
  );
}

function GroupLabelCell({
  indent,
  open,
  highlighted,
  expandedProject = false,
  title,
  subtitle,
  emphasized,
}: {
  indent: 0 | 1;
  open: boolean;
  highlighted: boolean;
  expandedProject?: boolean;
  title: string;
  subtitle: string;
  emphasized?: boolean;
}) {
  const indentStyle = unitEconomicsHierarchyIndentStyle(indent);

  return (
    <td className="border-border border-b px-3 py-2" style={indentStyle}>
      <div
        className={cn(
          'flex items-start gap-1.5',
          unitEconomicsHierarchyLabelGuideClass(indent, highlighted, { expandedProject }),
        )}
      >
        <HierarchyChevron open={open} />
        <div className="min-w-0">
          <p className={unitEconomicsHierarchyTitleClass(Boolean(emphasized), expandedProject)}>
            {title}
          </p>
          <p className="text-muted-foreground text-[11px]">{subtitle}</p>
        </div>
      </div>
    </td>
  );
}

function renderOrderRows(
  product: UnitEconomicsTreeProduct,
  productOpen: boolean,
  activeOrderId: string | null,
  onDrilldown?: DrilldownHandler,
) {
  if (!productOpen) return [];
  return product.orders.map((row) => {
    const isActive = activeOrderId === row.orderId;
    const highlighted = productOpen;
    return (
      <tr
        key={row.orderId}
        className={unitEconomicsHierarchyRowClass(2, { highlighted, isActive })}
        tabIndex={0}
        role="button"
        aria-label={`Open ${row.orderCode} detail`}
        onClick={() => onDrilldown?.(row.orderId, 'invoices')}
        onKeyDown={(event) =>
          handleUnitEconomicsRowKeyDown(event, () => onDrilldown?.(row.orderId, 'invoices'))
        }
      >
        <OrderLabelCell row={row} indent={2} highlighted={highlighted} />
        <UnitEconomicsOverviewMoneyCells row={row} onDrilldown={onDrilldown} />
      </tr>
    );
  });
}

function renderProjectRows(
  project: UnitEconomicsTreeProject,
  projectOpen: boolean,
  productOpenKeys: ReadonlySet<string>,
  onToggleProduct: (key: string) => void,
  activeOrderId: string | null,
  onDrilldown?: DrilldownHandler,
) {
  if (!projectOpen) return [];
  return project.products.flatMap((product) => {
    const productOpen = productOpenKeys.has(product.key);
    const highlighted = projectOpen;
    return [
      <tr
        key={product.key}
        className={unitEconomicsHierarchyRowClass(1, { highlighted, open: productOpen })}
        tabIndex={0}
        role="button"
        aria-expanded={productOpen}
        aria-label={`${productOpen ? 'Collapse' : 'Expand'} ${product.label}`}
        onClick={() => onToggleProduct(product.key)}
        onKeyDown={(event) =>
          handleUnitEconomicsRowKeyDown(event, () => onToggleProduct(product.key))
        }
      >
        <GroupLabelCell
          indent={1}
          open={productOpen}
          highlighted={highlighted}
          title={product.label}
          subtitle={`${product.unitCount} order${product.unitCount === 1 ? '' : 's'}`}
        />
        <UnitEconomicsOverviewMoneyCells row={product} staticOnly />
      </tr>,
      ...renderOrderRows(product, productOpen, activeOrderId, onDrilldown),
    ];
  });
}

function resolveActiveBranch(
  tree: UnitEconomicsTreeProject[],
  activeOrderId: string | null,
): ActiveBranch | null {
  if (!activeOrderId) return null;
  for (const project of tree) {
    for (const product of project.products) {
      if (product.orders.some((order) => order.orderId === activeOrderId)) {
        return { projectId: project.projectId, productKey: product.key };
      }
    }
  }
  return null;
}

export function UnitEconomicsNestedTable({
  data,
  items,
  activeOrderId = null,
  onDrilldown,
}: {
  data: UnitEconomicsBoardData;
  items: UnitEconomicsRow[];
  activeOrderId?: string | null;
  onDrilldown?: DrilldownHandler;
}) {
  const { projects, loading, error, reload, filteredTotals } = data;
  const tree = useMemo(() => buildUnitEconomicsTree(items, projects), [items, projects]);
  const activeBranch = useMemo(
    () => resolveActiveBranch(tree, activeOrderId),
    [tree, activeOrderId],
  );
  const [openProjects, setOpenProjects] = useState<Set<string>>(() => new Set());
  const [openProducts, setOpenProducts] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const first = tree[0];
    if (!first) return;
    setOpenProjects((prev) => {
      if (prev.size > 0) return prev;
      return new Set([first.projectId]);
    });
  }, [tree]);

  useEffect(() => {
    if (!activeBranch) return;
    setOpenProjects((prev) => new Set(prev).add(activeBranch.projectId));
    setOpenProducts((prev) => new Set(prev).add(activeBranch.productKey));
  }, [activeBranch]);

  const expandAll = useCallback(() => {
    setOpenProjects(new Set(tree.map((project) => project.projectId)));
    setOpenProducts(
      new Set(tree.flatMap((project) => project.products.map((product) => product.key))),
    );
  }, [tree]);

  const collapseAll = useCallback(() => {
    setOpenProjects(new Set());
    setOpenProducts(new Set());
  }, []);

  const toggleProject = useCallback((projectId: string) => {
    setOpenProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }, []);

  const toggleProduct = useCallback((key: string) => {
    setOpenProducts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  if (loading && items.length === 0) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void reload()} />;

  return (
    <UnitEconomicsTableShell
      minWidth="min-w-[56rem]"
      hint={
        <p className="text-muted-foreground text-sm">
          Project → product → order. Click a row to expand a level or open a unit sheet; amount
          cells open a specific tab.
        </p>
      }
      toolbar={
        <>
          <Button type="button" variant="outline" size="sm" onClick={expandAll}>
            Expand all
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={collapseAll}>
            Collapse all
          </Button>
        </>
      }
    >
      <UnitEconomicsTableHead>
        <tr className="text-muted-foreground text-left">
          <th className="border-border border-b px-3 py-2 font-semibold">Hierarchy</th>
          <th
            colSpan={2}
            className="border-border border-b px-2 py-2 text-center text-[10px] font-semibold tracking-wide uppercase"
          >
            Money in
          </th>
          <th
            colSpan={3}
            className="border-border border-b px-2 py-2 text-center text-[10px] font-semibold tracking-wide uppercase"
          >
            Money out
          </th>
          <th
            colSpan={2}
            className="border-border border-b px-2 py-2 text-center text-[10px] font-semibold tracking-wide uppercase"
          >
            Balance
          </th>
        </tr>
        <tr className="text-muted-foreground text-left">
          <th className="border-border border-b px-3 py-2" />
          <th className="border-border border-b px-2 py-2 text-right font-semibold">Received</th>
          <th className="border-border border-b px-2 py-2 text-right font-semibold">To receive</th>
          <th className="border-border border-b px-2 py-2 text-right font-semibold">Spent</th>
          <th className="border-border border-b px-2 py-2 text-right font-semibold">
            Bonus to pay
          </th>
          <th className="border-border border-b px-2 py-2 text-right font-semibold">Committed</th>
          <th className="border-border border-b px-2 py-2 text-right font-semibold">Cash</th>
          <th className="border-border border-b px-2 py-2 text-right font-semibold">Margin</th>
        </tr>
      </UnitEconomicsTableHead>
      <tbody>
        {tree.length === 0 ? (
          <tr>
            <td colSpan={8} className="text-muted-foreground px-3 py-8 text-center">
              No delivery units with financial activity yet.
            </td>
          </tr>
        ) : (
          tree.map((project) => {
            const projectOpen = openProjects.has(project.projectId);
            return (
              <Fragment key={project.key}>
                <tr
                  className={unitEconomicsHierarchyRowClass(0, {
                    highlighted: projectOpen,
                    open: projectOpen,
                  })}
                  tabIndex={0}
                  role="button"
                  aria-expanded={projectOpen}
                  aria-label={`${projectOpen ? 'Collapse' : 'Expand'} ${project.projectName}`}
                  onClick={() => toggleProject(project.projectId)}
                  onKeyDown={(event) =>
                    handleUnitEconomicsRowKeyDown(event, () => toggleProject(project.projectId))
                  }
                >
                  <GroupLabelCell
                    indent={0}
                    open={projectOpen}
                    highlighted={projectOpen}
                    expandedProject={projectOpen}
                    title={project.projectName}
                    subtitle={`${project.projectCode} · ${project.unitCount} orders`}
                    emphasized
                  />
                  <UnitEconomicsOverviewMoneyCells row={project} staticOnly />
                </tr>
                {renderProjectRows(
                  project,
                  projectOpen,
                  openProducts,
                  toggleProduct,
                  activeOrderId,
                  onDrilldown,
                )}
              </Fragment>
            );
          })
        )}
        {tree.length > 0 ? <UnitEconomicsOverviewFooter totals={filteredTotals} /> : null}
      </tbody>
    </UnitEconomicsTableShell>
  );
}
