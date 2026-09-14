'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  departmentsApi,
  type DepartmentItem,
  type DepartmentWithMembers,
} from '@/lib/api/employees';
import { ORG_COMPANY_NODE_ID } from './org-chart-constants';
import { orgSeatsApi } from '@/lib/api/org-seats';
import { overlayOrgSeats } from './org-chart-seats';
import { findLayoutNode, layoutOrgChart, type OrgChartLayout } from './org-chart-layout';
import { firstMatchingDepartmentId } from './org-chart-members';
import { stepZoomViewport } from './org-chart-pan-zoom';
import { buildOrgChartTree } from './org-chart-tree';
import {
  centerOrgChartNode,
  hasOrgChartViewportSize,
  type OrgChartViewport,
} from './org-chart-viewport';
import { OrgChartCanvas } from './OrgChartCanvas';
import { OrgChartNodes } from './OrgChartNodes';
import { OrgChartZoomControls } from './OrgChartZoomControls';
import { OrgDepartmentDrawer } from './OrgDepartmentDrawer';
import { useOrgChartExpanded } from './use-org-chart-expanded';
import { useOrgChartCanvasBox, useOrgChartFit, useOrgChartOriginPan } from './use-org-chart-fit';

export function OrgChartWorkspace({
  departments,
  myDepartmentIds,
  primaryDepartmentId,
  search,
  onRegisterFind,
  onAddDepartment,
  onOpenEmployee,
}: {
  departments: DepartmentItem[];
  myDepartmentIds: ReadonlySet<string>;
  primaryDepartmentId: string | null;
  search: string;
  onRegisterFind: (finder: () => void) => void;
  onAddDepartment: (parentId: string | null) => void;
  onOpenEmployee?: (employeeId: string) => void;
}) {
  const chart = useOrgChartState(departments, search, onRegisterFind, primaryDepartmentId);
  return (
    <OrgChartStage
      departments={departments}
      myDepartmentIds={myDepartmentIds}
      chart={chart}
      onAddDepartment={onAddDepartment}
      onOpenEmployee={onOpenEmployee}
    />
  );
}

function OrgChartStage({
  departments,
  myDepartmentIds,
  chart,
  onAddDepartment,
  onOpenEmployee,
}: {
  departments: DepartmentItem[];
  myDepartmentIds: ReadonlySet<string>;
  chart: ReturnType<typeof useOrgChartState>;
  onAddDepartment: (parentId: string | null) => void;
  onOpenEmployee?: (employeeId: string) => void;
}) {
  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden">
      <div className="relative h-full min-h-0 min-w-0 flex-1">
        <OrgChartCanvas
          canvasRef={chart.canvasRef}
          layout={chart.layout}
          viewport={chart.viewport}
          onViewportChange={chart.setViewport}
        >
          <OrgChartNodes
            departments={departments}
            layout={chart.layout}
            expandedIds={chart.expandedIds}
            selectedId={chart.selectedId}
            myDepartmentIds={myDepartmentIds}
            onSelect={chart.setSelectedId}
            onToggleExpanded={chart.toggleExpanded}
            onAddChild={onAddDepartment}
            onOpenEmployee={onOpenEmployee}
          />
        </OrgChartCanvas>
        <OrgChartZoomControls
          scale={chart.viewport.scale}
          onFindMe={chart.findMe}
          onZoomOut={chart.zoomOut}
          onZoomIn={chart.zoomIn}
        />
      </div>
      {chart.selectedId && chart.selectedId !== ORG_COMPANY_NODE_ID ? (
        <OrgDepartmentDrawer
          department={chart.drawer}
          loading={chart.drawerLoading}
          onClose={() => chart.setSelectedId(null)}
          onOpenEmployee={onOpenEmployee}
        />
      ) : null}
    </div>
  );
}

function useOrgChartState(
  departments: DepartmentItem[],
  search: string,
  onRegisterFind: (finder: () => void) => void,
  primaryDepartmentId: string | null,
) {
  const t = useTranslations('hr');
  const canvasRef = useRef<HTMLDivElement>(null);
  const didFitRef = useRef(false);
  const { expandedIds, toggleExpanded, expandPathTo } = useOrgChartExpanded(departments);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<OrgChartViewport>({ scale: 1, tx: 0, ty: 0 });
  const [drawer, setDrawer] = useState<DepartmentWithMembers | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const layout = useMemo(
    () => layoutOrgChart(buildOrgChartTree(departments), expandedIds),
    [departments, expandedIds],
  );
  const canvasBox = useOrgChartCanvasBox(canvasRef);
  const focusDepartment = useCallback(
    (departmentId: string) => {
      expandPathTo(departments, departmentId);
      setSelectedId(departmentId);
      setPendingFocusId(departmentId);
    },
    [departments, expandPathTo],
  );

  useOrgChartFit(layout, canvasBox, didFitRef, setViewport);
  useOrgChartOriginPan(layout.originX, didFitRef, setViewport);
  useFocusPendingNode(
    pendingFocusId,
    layout,
    viewport.scale,
    canvasBox,
    setViewport,
    setPendingFocusId,
  );
  useSelectedDepartmentDrawer(selectedId, setDrawer, setDrawerLoading, t);
  useEffect(() => {
    onRegisterFind(() => {
      const id = firstMatchingDepartmentId(departments, search);
      if (id) focusDepartment(id);
    });
  }, [departments, focusDepartment, onRegisterFind, search]);

  return {
    canvasRef,
    layout,
    viewport,
    setViewport,
    expandedIds,
    selectedId,
    setSelectedId,
    toggleExpanded,
    drawer,
    drawerLoading,
    findMe: () =>
      primaryDepartmentId
        ? focusDepartment(primaryDepartmentId)
        : setPendingFocusId(layout.nodes[0]?.id ?? ORG_COMPANY_NODE_ID),
    zoomOut: () => zoomCanvas(canvasRef.current, viewport, setViewport, -1),
    zoomIn: () => zoomCanvas(canvasRef.current, viewport, setViewport, 1),
  };
}

function useFocusPendingNode(
  pendingFocusId: string | null,
  layout: OrgChartLayout,
  scale: number,
  canvasBox: { width: number; height: number },
  setViewport: (next: OrgChartViewport) => void,
  setPendingFocusId: (id: string | null) => void,
): void {
  useEffect(() => {
    if (!pendingFocusId) return;
    const node = findLayoutNode(layout, pendingFocusId);
    if (!node || !hasOrgChartViewportSize(canvasBox)) return;
    setViewport(
      centerOrgChartNode({
        node,
        scale,
        viewportWidth: canvasBox.width,
        viewportHeight: canvasBox.height,
      }),
    );
    setPendingFocusId(null);
  }, [canvasBox, layout, pendingFocusId, scale, setPendingFocusId, setViewport]);
}

function useSelectedDepartmentDrawer(
  selectedId: string | null,
  setDrawer: (dept: DepartmentWithMembers | null) => void,
  setDrawerLoading: (loading: boolean) => void,
  t: ReturnType<typeof useTranslations>,
): void {
  useEffect(() => {
    if (!selectedId || selectedId === ORG_COMPANY_NODE_ID) {
      setDrawer(null);
      return undefined;
    }
    let cancelled = false;
    setDrawerLoading(true);
    void Promise.all([departmentsApi.getById(selectedId), orgSeatsApi.getAll(selectedId)])
      .then(([data, seats]) => {
        if (!cancelled) {
          const overlaySeats = Array.isArray(seats) ? seats : [];
          setDrawer({
            ...data,
            members: overlayOrgSeats([data], overlaySeats)[0]?.members ?? data.members ?? [],
          });
        }
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : t('deptAdmin.membersLoadFailed'));
        if (!cancelled) setDrawer(null);
      })
      .finally(() => {
        if (!cancelled) setDrawerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, setDrawer, setDrawerLoading, t]);
}

function zoomCanvas(
  canvas: HTMLDivElement | null,
  viewport: OrgChartViewport,
  setViewport: (next: OrgChartViewport) => void,
  direction: 1 | -1,
): void {
  if (!canvas) return;
  setViewport(stepZoomViewport(viewport, canvas, direction));
}
