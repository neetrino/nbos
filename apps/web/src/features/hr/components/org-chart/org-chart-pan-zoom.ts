import { ORG_WHEEL_ZOOM_SENSITIVITY, ORG_ZOOM_STEP } from './org-chart-constants';
import {
  clampOrgChartScale,
  panOrgChart,
  zoomOrgChartAt,
  type OrgChartViewport,
} from './org-chart-viewport';

export type OrgChartDragState = {
  pointerId: number | null;
  lastX: number;
  lastY: number;
  moved: boolean;
};

export function createOrgChartDragState(): OrgChartDragState {
  return { pointerId: null, lastX: 0, lastY: 0, moved: false };
}

export function canvasCursorPoint(
  canvas: HTMLElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

export function wheelZoomViewport(
  viewport: OrgChartViewport,
  canvas: HTMLElement,
  event: WheelEvent,
): OrgChartViewport {
  const point = canvasCursorPoint(canvas, event.clientX, event.clientY);
  const nextScale = viewport.scale * Math.exp(-event.deltaY * ORG_WHEEL_ZOOM_SENSITIVITY);
  return zoomOrgChartAt(viewport, nextScale, point.x, point.y);
}

export function stepZoomViewport(
  viewport: OrgChartViewport,
  canvas: HTMLElement,
  direction: 1 | -1,
): OrgChartViewport {
  const rect = canvas.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  return zoomOrgChartAt(viewport, viewport.scale + direction * ORG_ZOOM_STEP, cx, cy);
}

export function applyPointerPan(
  viewport: OrgChartViewport,
  drag: OrgChartDragState,
  clientX: number,
  clientY: number,
  threshold: number,
): { viewport: OrgChartViewport; drag: OrgChartDragState } {
  const dx = clientX - drag.lastX;
  const dy = clientY - drag.lastY;
  const moved = drag.moved || Math.hypot(dx, dy) > threshold;
  return {
    viewport: moved ? panOrgChart(viewport, dx, dy) : viewport,
    drag: { ...drag, lastX: clientX, lastY: clientY, moved },
  };
}

export function nextZoomStepScale(scale: number, direction: 1 | -1): number {
  return clampOrgChartScale(scale + direction * ORG_ZOOM_STEP);
}
