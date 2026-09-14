import { ORG_ZOOM_FIT_PADDING_PX, ORG_ZOOM_MAX, ORG_ZOOM_MIN } from './org-chart-constants';
import type { OrgChartLayoutNode } from './org-chart-layout';

export type OrgChartViewport = {
  scale: number;
  tx: number;
  ty: number;
};

export function clampOrgChartScale(scale: number): number {
  return Math.min(ORG_ZOOM_MAX, Math.max(ORG_ZOOM_MIN, scale));
}

export function zoomOrgChartAt(
  viewport: OrgChartViewport,
  nextScale: number,
  cursorX: number,
  cursorY: number,
): OrgChartViewport {
  const scale = clampOrgChartScale(nextScale);
  if (scale === viewport.scale) return viewport;
  const worldX = (cursorX - viewport.tx) / viewport.scale;
  const worldY = (cursorY - viewport.ty) / viewport.scale;
  return {
    scale,
    tx: cursorX - worldX * scale,
    ty: cursorY - worldY * scale,
  };
}

export function panOrgChart(viewport: OrgChartViewport, dx: number, dy: number): OrgChartViewport {
  return { ...viewport, tx: viewport.tx + dx, ty: viewport.ty + dy };
}

export function hasOrgChartViewportSize(size: { width: number; height: number }): boolean {
  return size.width > 0 && size.height > 0;
}

export function fitOrgChartInViewport(params: {
  contentWidth: number;
  contentHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}): OrgChartViewport {
  const { contentWidth, contentHeight, viewportWidth, viewportHeight } = params;
  if (!hasOrgChartViewportSize({ width: viewportWidth, height: viewportHeight })) {
    return { scale: 1, tx: 0, ty: 0 };
  }
  const pad = ORG_ZOOM_FIT_PADDING_PX;
  const availW = Math.max(1, viewportWidth - pad * 2);
  const availH = Math.max(1, viewportHeight - pad * 2);
  const scale = clampOrgChartScale(
    Math.min(availW / Math.max(contentWidth, 1), availH / Math.max(contentHeight, 1), 1),
  );
  return {
    scale,
    tx: (viewportWidth - contentWidth * scale) / 2,
    ty: pad,
  };
}

export function centerOrgChartNode(params: {
  node: OrgChartLayoutNode;
  scale: number;
  viewportWidth: number;
  viewportHeight: number;
}): OrgChartViewport {
  const { node, scale, viewportWidth, viewportHeight } = params;
  const clamped = clampOrgChartScale(scale);
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  return {
    scale: clamped,
    tx: viewportWidth / 2 - cx * clamped,
    ty: viewportHeight / 2 - cy * clamped,
  };
}

export function orgChartZoomPercent(scale: number): number {
  return Math.round(clampOrgChartScale(scale) * 100);
}
