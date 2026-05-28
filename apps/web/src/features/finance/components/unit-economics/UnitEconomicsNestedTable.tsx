'use client';

import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/shared';
import {
  buildUnitEconomicsTree,
  type UnitEconomicsTreeProduct,
  type UnitEconomicsTreeProject,
} from '@/features/finance/components/unit-economics/build-unit-economics-tree';
import type { UnitEconomicsBoardData } from '@/features/finance/components/unit-economics/unit-economics-board-data';
import { unitEconomicsOrderTypeLabel } from '@/features/finance/components/unit-economics/unit-economics-order-type-label';
import { UnitEconomicsOverviewMoneyCells } from '@/features/finance/components/unit-economics/unit-economics-row-money-cells';
import type { UnitEconomicsDrilldownFocus, UnitEconomicsRow } from '@/lib/api/unit-economics';

type DrilldownHandler = (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;

function ToggleButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  const Icon = open ? ChevronDown : ChevronRight;
  return (
    <button
      type="button"
      className="text-muted-foreground hover:text-foreground shrink-0 rounded p-0.5"
      aria-expanded={open}
      onClick={onClick}
    >
      <Icon className="size-3.5" aria-hidden />
    </button>
  );
}

function OrderLabelCell({
  row,
  indent,
  onDrilldown,
}: {
  row: UnitEconomicsRow;
  indent: number;
  onDrilldown?: DrilldownHandler;
}) {
  const typeLabel = unitEconomicsOrderTypeLabel(row.orderType);
  const title = onDrilldown ? (
    <button
      type="button"
      className="hover:text-primary text-left font-medium tabular-nums"
      onClick={() => onDrilldown(row.orderId, 'invoices')}
    >
      {row.orderCode}
    </button>
  ) : (
    <span className="font-medium tabular-nums">{row.orderCode}</span>
  );

  return (
    <td
      className="border-border border-b px-3 py-2"
      style={{ paddingLeft: `${12 + indent * 16}px` }}
    >
      <div className="flex items-start gap-1.5">
        <span className="mt-1 size-3.5 shrink-0" aria-hidden />
        <div className="min-w-0">
          {title}
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
  onToggle,
  title,
  subtitle,
}: {
  indent: number;
  open: boolean;
  onToggle: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <td
      className="border-border border-b px-3 py-2"
      style={{ paddingLeft: `${12 + indent * 16}px` }}
    >
      <div className="flex items-start gap-1.5">
        <ToggleButton open={open} onClick={onToggle} />
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="text-muted-foreground text-[11px]">{subtitle}</p>
        </div>
      </div>
    </td>
  );
}

function renderProductRows(
  product: UnitEconomicsTreeProduct,
  productOpen: boolean,
  onDrilldown?: DrilldownHandler,
) {
  if (!productOpen) return null;
  return product.orders.map((row) => (
    <tr key={row.orderId} className="hover:bg-muted/30">
      <OrderLabelCell row={row} indent={2} onDrilldown={onDrilldown} />
      <UnitEconomicsOverviewMoneyCells row={row} onDrilldown={onDrilldown} />
    </tr>
  ));
}

function renderProjectRows(
  project: UnitEconomicsTreeProject,
  projectOpen: boolean,
  productOpenKeys: ReadonlySet<string>,
  onToggleProduct: (key: string) => void,
  onDrilldown?: DrilldownHandler,
) {
  if (!projectOpen) return null;
  return project.products.flatMap((product) => {
    const productOpen = productOpenKeys.has(product.key);
    return [
      <tr key={product.key} className="hover:bg-muted/30">
        <GroupLabelCell
          indent={1}
          open={productOpen}
          onToggle={() => onToggleProduct(product.key)}
          title={product.label}
          subtitle={`${product.unitCount} order${product.unitCount === 1 ? '' : 's'}`}
        />
        <UnitEconomicsOverviewMoneyCells row={product} staticOnly />
      </tr>,
      ...renderProductRows(product, productOpen, onDrilldown),
    ];
  });
}

export function UnitEconomicsNestedTable({
  data,
  items,
  onDrilldown,
}: {
  data: UnitEconomicsBoardData;
  items: UnitEconomicsRow[];
  onDrilldown?: DrilldownHandler;
}) {
  const { projects, loading, error, reload } = data;
  const tree = useMemo(() => buildUnitEconomicsTree(items, projects), [items, projects]);
  const [openProjects, setOpenProjects] = useState<Set<string>>(() => new Set());
  const [openProducts, setOpenProducts] = useState<Set<string>>(() => new Set());

  if (loading && items.length === 0) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void reload()} />;

  const toggleProject = (projectId: string) => {
    setOpenProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const toggleProduct = (key: string) => {
    setOpenProducts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        Project → product → order. Expand a row to see the next level; click an order code or amount
        to drill down.
      </p>
      <div className="border-border bg-card overflow-auto rounded-xl border">
        <table className="w-full min-w-[56rem] border-collapse text-xs">
          <thead className="bg-card sticky top-0 z-10">
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
              <th className="border-border border-b px-2 py-2 text-right font-semibold">
                Received
              </th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">
                To receive
              </th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">Spent</th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">
                Bonus to pay
              </th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">
                Committed
              </th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">Cash</th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">Margin</th>
            </tr>
          </thead>
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
                    <tr className="bg-muted/20 hover:bg-muted/30">
                      <GroupLabelCell
                        indent={0}
                        open={projectOpen}
                        onToggle={() => toggleProject(project.projectId)}
                        title={project.projectName}
                        subtitle={`${project.projectCode} · ${project.unitCount} orders`}
                      />
                      <UnitEconomicsOverviewMoneyCells row={project} staticOnly />
                    </tr>
                    {renderProjectRows(
                      project,
                      projectOpen,
                      openProducts,
                      toggleProduct,
                      onDrilldown,
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
